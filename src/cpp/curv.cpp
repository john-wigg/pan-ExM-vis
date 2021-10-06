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

                float x = i * vsx;
                float y = j * vsy;
                float z = k * vsz;

                float t1 = sample_sdf(sdf_data, width, height, depth, x + h, y    , z    , vsx, vsy, vsz, min_sdf, max_sdf);
                float t2 = sample_sdf(sdf_data, width, height, depth, x - h, y    , z    , vsx, vsy, vsz, min_sdf, max_sdf);
                float t3 = sample_sdf(sdf_data, width, height, depth, x    , y + h, z    , vsx, vsy, vsz, min_sdf, max_sdf);
                float t4 = sample_sdf(sdf_data, width, height, depth, x    , y - h, z    , vsx, vsy, vsz, min_sdf, max_sdf);
                float t5 = sample_sdf(sdf_data, width, height, depth, x    , y    , z + h, vsx, vsy, vsz, min_sdf, max_sdf);
                float t6 = sample_sdf(sdf_data, width, height, depth, x    , y    , z - h, vsx, vsy, vsz, min_sdf, max_sdf);
                float t  = sample_sdf(sdf_data, width, height, depth, x    , y    , z    , vsx, vsy, vsz, min_sdf, max_sdf);
                
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