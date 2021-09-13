#include <vector>
#include <array>
#include <math.h>
#include <stdio.h>
#include <emscripten.h>
#include <emscripten/bind.h>

using namespace emscripten;

typedef struct P_t { 
    float x;
    float y;
    float z;
} P_t;

#define IDX2(i, j, w) ((i)+(j)*(w))
#define IDX3(i, j, k, w, h) ((i)+(j)*(w)+(k)*(w)*(h))

float sample_sdf(unsigned char *sdf, int width, int height, int depth, float size_x, float size_y, float size_z, float x, float y, float z) {
    int i = (int)(x / size_x * width);
    int j = (int)(y / size_y * height);
    int k = (int)(z / size_z * depth);

    return sdf[IDX3(i, j, k, width, height)];
}

void grad_sdf(unsigned char *sdf, int width, int height, int depth, float size_x, float size_y, float size_z, float x, float y, float z, float h) {
    float t1 = sample_sdf(sdf, width, height, depth, size_x, size_y, size_z, x+h, y, z);
    float t2 = sample_sdf(sdf, width, height, depth, size_x, size_y, size_z, x-h, y, z);
    float t3 = sample_sdf(sdf, width, height, depth, size_x, size_y, size_z, x, y+h, z);
    float t4 = sample_sdf(sdf, width, height, depth, size_x, size_y, size_z, x, y-h, z);
    float t5 = sample_sdf(sdf, width, height, depth, size_x, size_y, size_z, x, y, z+h);
    float t6 = sample_sdf(sdf, width, height, depth, size_x, size_y, size_z, x, y, z-h);
    float t  = sample_sdf(sdf, width, height, depth, size_x, size_y, size_z, x, y, z);

    // TODO: Calculate and normalize grad.
    //return normal = normalize(k.xyy * (t1-t2) + k.yxy * (t3-t4) + k.yyx * (t5-t6));
}

std::vector<P_t> seed_points(float size_x, float size_y, float size_z, float h) {
    std::vector<P_t> points;
    for (float x = 0.0; x < size_x; x += h) {
        for (float y = 0.0; y < size_y; y += h) {
            for (float z = 0.0; z < size_z; z += h) {
                P_t p;
                p.x = x;
                p.y = y;
                p.z = z;
                points.push_back(p);
            }
        }
    }
    return points;
}

std::vector<P_t> relax_points(std::vector<P_t> points, unsigned char *sdf, int width, int height, int depth) {
    // TODO: Check global error instead of fixed iterations.
    for (int it = 0; it < 10; ++it) {
        for (int i = 0; i < points.size(); ++i) {

            // TODO: Calculate gradient at point p.
        }
    }

    return points;
}

std::vector<std::vector<P_t>> skeletonise(float size_x, float size_y, float size_z) {
    std::vector<std::vector<P_t>> skeleton;

    std::vector<P_t> points = seed_points(size_x, size_y, size_z, 10.0);

    // DEBUG
    skeleton.push_back(points);

    return skeleton;
}

EMSCRIPTEN_BINDINGS(module) {
    function("skeletonise", &skeletonise);

    value_array<P_t>("P_t")
        .element(&P_t::x)
        .element(&P_t::y)
        .element(&P_t::z);
    register_vector<P_t>("vector<P_t>");
    register_vector<std::vector<P_t>>("vector<vector<P_t>>");
}