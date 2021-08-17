#include <vector>
#include <array>
#include <math.h>
#include <stdio.h>
#include <emscripten.h>

extern "C" {
  unsigned char * danielsson(unsigned char *volume, int width, int height, int depth, int _start, int _stop, unsigned char target);
}


#define IDX2(i, j, w) ((i)+(j)*(w))
#define IDX3(i, j, k, w, h) ((i)+(j)*(w)+(k)*(w)*(h))

// Hardcoded (for now) z/x (or z/y) voxel aspect.
const float voxelSize[3] = { 0.24, 0.24, 0.2999309 };

typedef struct L_t { 
    uint16_t x;
    uint16_t y;
    uint16_t z;
} L_t;

L_t min(L_t L1, L_t L2) {
    float vx2 = voxelSize[0]*voxelSize[0];
    float vy2 = voxelSize[1]*voxelSize[1];
    float vz2 = voxelSize[1]*voxelSize[2];
    float d1 = vx2*L1.x*L1.x+vy2*L1.y*L1.y+vz2*L1.z*L1.z;
    float d2 = vx2*L2.x*L2.x+vy2*L2.y*L2.y+vz2*L2.z*L2.z;
    return (d1 < d2) ? L1 : L2;
}

void sweep(L_t *L, int width, int height, int depth) {
    for (int k = 1; k < depth; ++k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i, j, k-1, width, height)];
                L2.z += 1;
                L[IDX3(i, j, k, width, height)] = min(L1, L2);
            }
        }

        for (int j = 1; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i, j-1, k, width, height)];
                L2.y += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2);
            }

            for (int i = 1; i < width; ++i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i-1, j, k, width, height)];
                L2.x += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2);
            }

            for (int i = width-2; i >= 0; --i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i+1, j, k, width, height)];
                L2.x += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2);
            }
        }

        for (int j = height-2; j >= 0; --j) {
            for (int i = 0; i < width; ++i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i, j+1, k, width, height)];
                L2.y += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2);
            }

            for (int i = 1; i < width; ++i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i-1, j, k, width, height)];
                L2.x += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2);
            }

            for (int i = width-2; i >= 0; --i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i+1, j, k, width, height)];
                L2.x += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2);
            }
        }

        EM_ASM({
            postMessage(['progress', $0]);
        }, 0.5*float(k + 1)/depth);
    }
    
    for (int k = depth-2; k >= 0; --k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i, j, k+1, width, height)];
                L2.z += 1;
                L[IDX3(i, j, k, width, height)] = min(L1, L2);
            }
        }

        for (int j = 1; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i, j-1, k, width, height)];
                L2.y += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2);
            }

            for (int i = 1; i < width; ++i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i-1, j, k, width, height)];
                L2.x += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2);
            }

            for (int i = width-2; i >= 0; --i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i+1, j, k, width, height)];
                L2.x += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2);
            }
        }

        for (int j = height-2; j >= 0; --j) {
            for (int i = 0; i < width; ++i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i, j+1, k, width, height)];
                L2.y += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2);
            }

            for (int i = 1; i < width; ++i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i-1, j, k, width, height)];
                L2.x += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2);
            }

            for (int i = width-2; i >= 0; --i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i+1, j, k, width, height)];
                L2.x += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2);
            }
        }

        EM_ASM({
            postMessage(['progress', $0]);
        }, 0.5+0.5*float(depth-2-k + 1)/depth);
    }
}

void hullmarch(unsigned char *volume, L_t *L, int width, int height, int depth, unsigned char target) {
    for (int k = 0; k < depth; ++k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                L[IDX3(i  , j  , k  , width, height)].x = 9999;
                L[IDX3(i  , j  , k  , width, height)].y = 9999;
                L[IDX3(i  , j  , k  , width, height)].z = 9999;
            }
        }
    }

    for (int k = 0; k < depth; ++k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                bool b  = volume[IDX3(i  , j  , k  , width, height)] == target;
                bool b1 = volume[IDX3(i+1, j  , k  , width, height)] == target;
                bool b2 = volume[IDX3(i  , j+1, k  , width, height)] == target;
                bool b3 = volume[IDX3(i  , j  , k+1, width, height)] == target;

                if (b1 != b) {
                    if (b) {
                        L[IDX3(i  , j  , k  , width, height)].x = 0;
                        L[IDX3(i  , j  , k  , width, height)].y = 0;
                        L[IDX3(i  , j  , k  , width, height)].z = 0;
                    } else {
                        L[IDX3(i+1, j  , k  , width, height)].x = 0;
                        L[IDX3(i+1, j  , k  , width, height)].y = 0;
                        L[IDX3(i+1, j  , k  , width, height)].z = 0;
                    }
                }

                if (b2 != b) {
                    if (b) {
                        L[IDX3(i  , j  , k  , width, height)].x = 0;
                        L[IDX3(i  , j  , k  , width, height)].y = 0;
                        L[IDX3(i  , j  , k  , width, height)].z = 0;
                    } else {
                        L[IDX3(i  , j+1, k  , width, height)].x = 0;
                        L[IDX3(i  , j+1, k  , width, height)].y = 0;
                        L[IDX3(i  , j+1, k  , width, height)].z = 0;
                    }
                }

                if (b3 != b) {
                    if (b) {
                        L[IDX3(i  , j  , k  , width, height)].x = 0;
                        L[IDX3(i  , j  , k  , width, height)].y = 0;
                        L[IDX3(i  , j  , k  , width, height)].z = 0;
                    } else {
                        L[IDX3(i  , j  , k+1, width, height)].x = 0;
                        L[IDX3(i  , j  , k+1, width, height)].y = 0;
                        L[IDX3(i  , j  , k+1, width, height)].z = 0;
                    }
                }
            } 
        }
    }
}

unsigned char * danielsson(unsigned char *volume, int width, int height, int depth, int _start, int _stop, unsigned char target) {
    std::vector<L_t> L(width*height*depth);
    
    hullmarch(volume, L.data(), width, height, depth, target);

    sweep(L.data(), width, height, depth);

    std::vector<unsigned char> data(width*height*depth);

    for (int k = 0; k < depth; ++k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                L_t L0 = L[IDX3(i, j, k, width, height)];

                float vx2 = voxelSize[0]*voxelSize[0];
                float vy2 = voxelSize[1]*voxelSize[1];
                float vz2 = voxelSize[1]*voxelSize[2];
                float dist = sqrt(vx2*L0.x*L0.x+vy2*L0.y*L0.y+vz2*L0.z*L0.z); // TODO: proper scaling with voxel sizes
                if (volume[IDX3(i, j, k, width, height)] == target) dist *= -1.0;
                data[IDX3(i, j, k, width, height)] = (unsigned char)fmax(fmin((dist + 5.0) * 10.0, 255.0), 0.0);
            } 
        }
    }

    return data.data();
}