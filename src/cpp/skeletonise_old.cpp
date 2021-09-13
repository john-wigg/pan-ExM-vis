#include <vector>
#include <array>
#include <math.h>
#include <stdio.h>
#include <emscripten.h>

extern "C" {
  std::vector<std::vector<P_t>> skeletonise(unsigned char *sdf, int width, int height, int depth);
}

typedef struct P_t { 
    float x;
    float y;
    float z;
} P_t;


#define IDX2(i, j, w) ((i)+(j)*(w))
#define IDX3(i, j, k, w, h) ((i)+(j)*(w)+(k)*(w)*(h))

std::vector<P_t> find_apex_points(unsigned char *volume, int width, int height, int depth) {
    std::vector<P_t> apex_points;

    // TODO: Don't check voxels inside the volume.
    for (int k = 0; k < depth; ++k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                int min_dist = 99999;
                for (int kk = k-1; kk <= k+1; ++kk) {
                    for (int jj = j-1; jj <= j+1; ++jj) {
                        for (int ii = i-1; ii <= i+1; ++ii) {
                            min_dist = min(min_dist, sdf[IDX3(ii, jj, kk, width, height, depth)]);
                        }
                    }
                }

                if (min_dist == sdf[IDX3(i, j, k, width, height, depth)]) {
                    P_t apex;
                    P_t.x = i;
                    P_t.y = j;
                    P_t.z = k;
                    apex_points.push_back(apex);
                }
            }
        }
    }

    return apex_points;
}

std::vector<std::vector<P_t>> skeletonise(unsigned char *volume, int width, int height, int depth) {
    std::vector<std::vector<P_t>> skeleton;

    std::vector<P_t> apex_points = find_apex_points(volume, width, height, depth);

    return skeleton;
}