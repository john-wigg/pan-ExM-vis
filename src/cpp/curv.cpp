#include <vector>
#include <array>
#include <math.h>
#include <stdio.h>
#include <emscripten.h>
#include <emscripten/bind.h>

using namespace emscripten;

val curvature(const val sdf, int width, int height, int depth, float vsx, float vsy, float vsz, float h, float min_sdf, float max_sdf, val onProgress);

#define min(a, b) a < b ? a : b
#define max(a, b) a > b ? a : b

#define IDX2(i, j, w) ((i)+(j)*(w))
#define IDX3(i, j, k, w, h) ((i)+(j)*(w)+(k)*(w)*(h))

inline float sample_sdf_x_off(const std::vector<unsigned char> &sdf, int i, int j, int k, int width, int height, int depth, float h, float hx, float min_sdf, float max_sdf) {
    float ioff = h / hx;
    float a = ioff - floor(ioff);

    int i1 = min(max(0, i + (int)floor(ioff)), width-1);
    int i2 = min(i1 + 1, width-1);

    unsigned char px = (1.0 - a) * sdf[IDX3(i1, j, k, width, height)]  + a * sdf[IDX3(i2, j, k, width, height)];
    return (float)px / 10.0 - 5.0;
}

inline float sample_sdf_y_off(const std::vector<unsigned char> &sdf, int i, int j, int k, int width, int height, int depth, float h, float hy, float min_sdf, float max_sdf) {
    float joff = h / hy;
    float a = joff - floor(joff);

    int j1 = min(max(0, j + (int)floor(joff)), height-1);
    int j2 = min(j1 + 1, height-1);

    unsigned char px = (1.0 - a) * sdf[IDX3(i, j1, k, width, height)]  + a * sdf[IDX3(i, j2, k, width, height)];
    return (float)px / 10.0 - 5.0;
}


inline float sample_sdf_z_off(const std::vector<unsigned char> &sdf, int i, int j, int k, int width, int height, int depth, float h, float hz, float min_sdf, float max_sdf) {
    float koff = h / hz;
    float a = koff - floor(koff);

    int k1 = min(max(0, k + (int)floor(koff)), depth-1);
    int k2 = min(k1 + 1, depth-1);

    unsigned char px = (1.0 - a) * sdf[IDX3(i, j, k1, width, height)]  + a * sdf[IDX3(i, j, k2, width, height)];
    return (float)px / 10.0 - 5.0;
}


inline float sample_sdf(const std::vector<unsigned char> &sdf, int w, int h, int d, float x, float y, float z, float vsx, float vsy, float vsz, float min_sdf, float max_sdf) {
    // sort of nearest neighbour
    int i = min(max(0, x / vsx), w-1);
    int j = min(max(0, y / vsy), h-1);
    int k = min(max(0, z / vsz), d-1);

    unsigned char px = sdf[IDX3(i, j, k, w, h)];
    return (float)px / 10.0 - 5.0;
}

val curvature(const val sdf, int width, int height, int depth, float vsx, float vsy, float vsz, float h, float min_sdf, float max_sdf, val onProgress) {
    std::vector<unsigned char> sdf_data = convertJSArrayToNumberVector<unsigned char>(sdf);
    std::vector<unsigned char> curvature_data(sdf_data.size());

    for (int k = 0; k < depth; ++k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                int index3 = IDX3(i, j, k, width, height);

                float t1 = sample_sdf_x_off(sdf_data, i, j, k, width, height, depth,  h, vsx, min_sdf, max_sdf);
                float t2 = sample_sdf_x_off(sdf_data, i, j, k, width, height, depth, -h, vsx, min_sdf, max_sdf);
                float t3 = sample_sdf_y_off(sdf_data, i, j, k, width, height, depth,  h, vsy, min_sdf, max_sdf);
                float t4 = sample_sdf_y_off(sdf_data, i, j, k, width, height, depth, -h, vsy, min_sdf, max_sdf);
                float t5 = sample_sdf_z_off(sdf_data, i, j, k, width, height, depth,  h, vsz, min_sdf, max_sdf);
                float t6 = sample_sdf_z_off(sdf_data, i, j, k, width, height, depth, -h, vsz, min_sdf, max_sdf);

                float t  = sample_sdf_x_off(sdf_data, i, j, k, width, height, depth,  0, vsx, min_sdf, max_sdf);
                
                float c = (t1+t2+t3+t4+t5+t6-6.0*t)/(h*h);
                
                curvature_data[index3] = (unsigned char)(fmin(fmax(0.0, 0.2*c + 0.5), 1.0) * 255.0); // mean curvature is just the Jacobian of the SDF
            }
        }
        onProgress((float)k / depth);
    }

    return val{ typed_memory_view(curvature_data.size(), curvature_data.data()) };
}

EMSCRIPTEN_BINDINGS(module) {
    function("curvature", &curvature);
}