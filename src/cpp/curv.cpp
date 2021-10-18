#include <vector>
#include <array>
#include <math.h>
#include <stdio.h>
#include <emscripten.h>
#include <emscripten/bind.h>

using namespace emscripten;

struct CurvResult;

CurvResult curvature(const val sdf, float min_sdf, float max_sdf, int width, int height, int depth, float vsx, float vsy, float vsz, float h, val onProgress);

struct CurvResult {
    val data = val { 0 };
    float min;
    float max;
};

#define min(a, b) a < b ? a : b
#define max(a, b) a > b ? a : b

#define IDX2(i, j, w) ((i)+(j)*(w))
#define IDX3(i, j, k, w, h) ((i)+(j)*(w)+(k)*(w)*(h))

inline float sample_sdf(const std::vector<unsigned char> &sdf, int i, int j, int k, int width, int height, float min_sdf, float max_sdf) {
    return sdf[IDX3(i, j, k, width, height)] / 255.0 * (max_sdf - min_sdf) + min_sdf;
}

inline float sample_sdf_x_lerp(const std::vector<unsigned char> &sdf, int i, int j, int k, int width, int height, int depth, float h, float hx, float min_sdf, float max_sdf) {
    float ioff = h / hx;
    float a = ioff - floor(ioff);

    int i1 = min(max(0, i + (int)floor(ioff)), width-1);
    int i2 = min(i1 + 1, width-1);

    float px = (1.0 - a) * sample_sdf(sdf, i1, j, k, width, height, min_sdf, max_sdf)  + a * sample_sdf(sdf, i2, j, k, width, height, min_sdf, max_sdf);
    return px;
}

inline float sample_sdf_y_lerp(const std::vector<unsigned char> &sdf, int i, int j, int k, int width, int height, int depth, float h, float hy, float min_sdf, float max_sdf) {
    float joff = h / hy;
    float a = joff - floor(joff);

    int j1 = min(max(0, j + (int)floor(joff)), height-1);
    int j2 = min(j1 + 1, height-1);

    float px = (1.0 - a) * sample_sdf(sdf, i, j1, k, width, height, min_sdf, max_sdf)  + a * sample_sdf(sdf, i, j2, k, width, height, min_sdf, max_sdf);
    return px;
}


inline float sample_sdf_z_lerp(const std::vector<unsigned char> &sdf, int i, int j, int k, int width, int height, int depth, float h, float hz, float min_sdf, float max_sdf) {
    float koff = h / hz;
    float a = koff - floor(koff);

    int k1 = min(max(0, k + (int)floor(koff)), depth-1);
    int k2 = min(k1 + 1, depth-1);

    float px = (1.0 - a) * sample_sdf(sdf, i, j, k1, width, height, min_sdf, max_sdf)  + a * sample_sdf(sdf, i, j, k2, width, height, min_sdf, max_sdf);
    return px;
}

CurvResult curvature(const val sdf, float min_sdf, float max_sdf, int width, int height, int depth, float vsx, float vsy, float vsz, float h, val onProgress) {
    std::vector<unsigned char> sdf_data = convertJSArrayToNumberVector<unsigned char>(sdf);
    std::vector<unsigned char> curvature_data(sdf_data.size());
    std::vector<float> curv_value(width*height*depth);

    float min_curv = 99999.9;
    float max_curv = -99999.9;

    for (int k = 0; k < depth; ++k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                int index3 = IDX3(i, j, k, width, height);

                float t1 = sample_sdf_x_lerp(sdf_data, i, j, k, width, height, depth,  h, vsx, min_sdf, max_sdf);
                float t2 = sample_sdf_x_lerp(sdf_data, i, j, k, width, height, depth, -h, vsx, min_sdf, max_sdf);
                float t3 = sample_sdf_y_lerp(sdf_data, i, j, k, width, height, depth,  h, vsy, min_sdf, max_sdf);
                float t4 = sample_sdf_y_lerp(sdf_data, i, j, k, width, height, depth, -h, vsy, min_sdf, max_sdf);
                float t5 = sample_sdf_z_lerp(sdf_data, i, j, k, width, height, depth,  h, vsz, min_sdf, max_sdf);
                float t6 = sample_sdf_z_lerp(sdf_data, i, j, k, width, height, depth, -h, vsz, min_sdf, max_sdf);

                float t  = sample_sdf_x_lerp(sdf_data, i, j, k, width, height, depth,  0, vsx, min_sdf, max_sdf);
                
                float c = (t1+t2+t3+t4+t5+t6-6.0*t)/(h*h);

                curv_value[index3] = c;
                min_curv = min(c, min_curv);
                max_curv = max(c, max_curv);
            }
        }
        onProgress((float)k / depth);
    }

    for (int k = 0; k < depth; ++k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                int index3 = IDX3(i, j, k, width, height);
                curvature_data[index3] = (unsigned char)((curv_value[index3] - min_curv) / (max_curv - min_curv) * 255.0);
            }
        }
    }

    CurvResult res;
    res.data = val{ typed_memory_view(curvature_data.size(), curvature_data.data()) };
    res.min = min_curv;
    res.max = max_curv;
    return res;
}

EMSCRIPTEN_BINDINGS(module) {
    value_object<CurvResult>("CurvResult")
        .field("data", &CurvResult::data)
        .field("min", &CurvResult::min)
        .field("max", &CurvResult::max)
        ;
    
    function("curvature", &curvature);
}