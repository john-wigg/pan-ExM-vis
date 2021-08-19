#include <vector>
#include <array>
#include <math.h>
#include <stdio.h>
#include <emscripten.h>

extern "C" {
  unsigned char * danielsson(unsigned char *volume, int width, int height, int depth, unsigned char target);
}

#define min(x, y) (x < y ? x : y)
#define max(x, y) (x > y ? x : y)

#define IDX2(i, j, w) ((i)+(j)*(w))
#define IDX3(i, j, k, w, h) ((i)+(j)*(w)+(k)*(w)*(h))

// 0 is +, 1 is -
#define SWEEP1 0x00000000
#define SWEEP2 0x00000001
#define SWEEP3 0x00000010
#define SWEEP4 0x00000011
#define SWEEP5 0x00000100
#define SWEEP6 0x00000101
#define SWEEP7 0x00000110
#define SWEEP8 0x00000111

// Hardcoded (for now) z/x (or z/y) voxel aspect.
const float voxelSize[3] = { 0.24, 0.24, 0.2999309 };

void sweep(float *sdf, int width, int height, int depth, unsigned char dir) {
    const int dx = (dir >> 0) & 1;
    const int dy = (dir >> 1) & 1;
    const int dz = (dir >> 2) & 1;

    const int sx = 1 - 2*dx;
    const int sy = 1 - 2*dy;
    const int sz = 1 - 2*dz;

    const int ox = (width-1) * dx;
    const int oy = (height-1) * dy;
    const int oz = (depth-1) * dz;

    for (int k = 0; k < depth; ++k) {
        int z = oz + sz*k;
        for (int j = 0; j < height; ++j) {
            int y = oy + sy*j;
            for (int i = 0; i < width; ++i) {
                int x = ox + sx*i;
                float d = sdf[IDX3(x, y, z, width, height)];

                float d1, d2, d3;
                if (x-sx > width-1 || x-sx < 0) d1 = 99999.9;
                else d1 = sdf[IDX3(x-sx, y, z, width, height)];
                if (y-sy > height-1 || y-sy < 0) d2 = 99999.9;
                else d2 = sdf[IDX3(x, y-sy, z, width, height)];
                if (z-sz > depth-1 || z-sz < 0) d3 = 99999.9;
                else  d3 = sdf[IDX3(x, y, z-sz, width, height)];

                // Sort in ascending order.
                float a1 = min(d1, min(d2, d3));
                float a2 = max(min(d1, d2), min(d2, d3));
                float a3 = max(d1, max(d2, d3));

                float a12 = a1-a2;
                float a13 = a1-a3;
                float a23 = a2-a3;

                float s1 = a1 + 1;
                float s2 = (a1+a2+sqrt(2.0-a12*a12))/2.0;
                float s3 = (a1+a2+a3+sqrt(3.0-a12*a12-a13*a13-a23*a23))/3.0;

                float dd = s3;
                if (fabs(s1) < a2) dd = s1;
                else if (fabs(s2) < a3) dd = s2;

                sdf[IDX3(x, y, z, width, height)] = min(d, dd);
            } 
        }
    }
}

void hullmarch(unsigned char *volume, float *sdf, int width, int height, int depth, unsigned char target) {
    for (int k = 0; k < depth; ++k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                bool b  = volume[IDX3(i  , j  , k  , width, height)]  == target;
                bool b1 = volume[IDX3(i+1, j  , k  , width, height)] == target;
                bool b2 = volume[IDX3(i  , j+1, k  , width, height)] == target;
                bool b3 = volume[IDX3(i  , j  , k+1, width, height)] == target;

                if (b1 != b) {
                    if (b) {
                        sdf[IDX3(i  , j  , k  , width, height)] = 0.0;
                    } else {
                        sdf[IDX3(i+1, j  , k  , width, height)] = 0.0;
                    }
                }

                if (b2 != b) {
                    if (b) {
                        sdf[IDX3(i  , j  , k  , width, height)] = 0.0;
                    } else {
                        sdf[IDX3(i  , j+1, k  , width, height)] = 0.0;
                    }
                }

                if (b3 != b) {
                    if (b) {
                        sdf[IDX3(i  , j  , k  , width, height)] = 0.0;
                    } else {
                        sdf[IDX3(i  , j  , k+1, width, height)] = 0.0;
                    }
                }
            } 
        }
    }
}

unsigned char * danielsson(unsigned char *volume, int width, int height, int depth, unsigned char target) {
    std::vector<float> sdf(width*height*depth, 99999.9);
    
    hullmarch(volume, sdf.data(), width, height, depth, target);
    
    for (int i = 0; i < 8; ++i) {
        sweep(sdf.data(), width, height, depth, i);

        EM_ASM({
            postMessage(['progress', $0]);
        }, 1.0/8.0);
    }

    std::vector<unsigned char> data(width*height*depth);

    for (int k = 0; k < depth; ++k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                float dist = sdf[IDX3(i, j, k, width, height)] * 0.25; // TODO: proper scaling with voxel sizes
                if (volume[IDX3(i, j, k, width, height)] == target) dist *= -1.0;
                data[IDX3(i, j, k, width, height)] = (unsigned char)max(min((dist + 5.0) * 10.0, 255.0), 0.0);
            } 
        }
    }

    return data.data();
}