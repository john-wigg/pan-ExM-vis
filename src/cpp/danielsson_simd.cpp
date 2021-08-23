#include <vector>
#include <array>
#include <math.h>
#include <stdio.h>
#include <emscripten.h>
#include <wasm_simd128.h>

extern "C" {
  unsigned char * danielsson(unsigned char *volume, int width, int height, int depth, unsigned char target);
}


#define IDX2(i, j, w) ((i)+(j)*(w))
#define IDX3(i, j, k, w, h) ((i)+(j)*(w)+(k)*(w)*(h))

// Hardcoded (for now) z/x (or z/y) voxel aspect.
const float voxelSize[3] = { 0.24, 0.24, 0.2999309 };

// Use a bitmask to reduce the memory footprint and
// increase cache hits. Allows for max. 4096x4096x256 stacks.
typedef struct L_t { 
    unsigned x:12;
    unsigned y:12;
    unsigned z:8;
} L_t;

v128_t vx2 = wasm_f32x4_splat(voxelSize[0]*voxelSize[0]);
v128_t vy2 = wasm_f32x4_splat(voxelSize[1]*voxelSize[1]);
v128_t vz2 = wasm_f32x4_splat(voxelSize[1]*voxelSize[2]);
v128_t v_one  = wasm_f32x4_splat(1);

v128_t min(L_t *L1, L_t *L2, int x, int y, int z) {
    v128_t L1x = wasm_f32x4_make(L1[0].x, L1[1].x, L1[2].x, L1[3].x);
    v128_t L1y = wasm_f32x4_make(L1[0].y, L1[1].y, L1[2].y, L1[3].y);
    v128_t L1z = wasm_f32x4_make(L1[0].z, L1[1].z, L1[2].z, L1[3].z);
    v128_t L2x = wasm_f32x4_make(L2[0].x, L2[1].x, L2[2].x, L2[3].x);
    v128_t L2y = wasm_f32x4_make(L2[0].x, L2[1].x, L2[2].x, L2[3].x);
    v128_t L2z = wasm_f32x4_make(L2[0].x, L2[1].x, L2[2].x, L2[3].x);

    if (x) L2x = wasm_f32x4_add(L2x, v_one);
    if (y) L2y = wasm_f32x4_add(L2y, v_one);
    if (z) L2z = wasm_f32x4_add(L2z, v_one);

    v128_t L1x2 = wasm_f32x4_mul(wasm_f32x4_mul(L1x, L1x), vx2);
    v128_t L1y2 = wasm_f32x4_mul(wasm_f32x4_mul(L1y, L1y), vy2);
    v128_t L1z2 = wasm_f32x4_mul(wasm_f32x4_mul(L1z, L1z), vz2);
    v128_t L2x2 = wasm_f32x4_mul(wasm_f32x4_mul(L2x, L2x), vx2);
    v128_t L2y2 = wasm_f32x4_mul(wasm_f32x4_mul(L2y, L2y), vy2);
    v128_t L2z2 = wasm_f32x4_mul(wasm_f32x4_mul(L2z, L2z), vz2);

    v128_t d1 = wasm_f32x4_add(wasm_f32x4_add(L1x2, L1y2), L1z2);
    v128_t d2 = wasm_f32x4_add(wasm_f32x4_add(L2x2, L2y2), L2z2);

    return wasm_v128_bitselect(d1, d2, wasm_f32x4_lt(d1, d2));
}

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
            for (int i = 0; i < width; i+=4) {
                L_t *L1 = &L[IDX3(i, j, k  , width, height)];
                L_t *L2 = &L[IDX3(i, j, k-1, width, height)];
                wasm_v128_store(&L[IDX3(i, j, k, width, height)], min(L1, L2, 0, 0, 1));
            }
        }

        for (int j = 1; j < height; ++j) {
            for (int i = 0; i < width; i+=4) {
                L_t *L1 = &L[IDX3(i, j, k  , width, height)];
                L_t *L2 = &L[IDX3(i, j-1, k, width, height)];
                wasm_v128_store(&L[IDX3(i, j, k, width, height)], min(L1, L2, 0, 1, 0));
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
            for (int i = 0; i < width; i+=4) {
                L_t *L1 = &L[IDX3(i, j, k  , width, height)];
                L_t *L2 = &L[IDX3(i, j+1, k, width, height)];
                wasm_v128_store(&L[IDX3(i, j, k, width, height)], min(L1, L2, 0, 1, 0));
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
        }, 0.5/depth);
    }
    
    for (int k = depth-2; k >= 0; --k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; i+=4) {
                L_t *L1 = &L[IDX3(i, j, k  , width, height)];
                L_t *L2 = &L[IDX3(i, j, k+1, width, height)];
                wasm_v128_store(&L[IDX3(i, j, k, width, height)], min(L1, L2, 0, 0, 1));
            }
        }

        for (int j = 1; j < height; ++j) {
            for (int i = 0; i < width; i+=4) {
                L_t *L1 = &L[IDX3(i, j, k  , width, height)];
                L_t *L2 = &L[IDX3(i, j-1, k, width, height)];
                wasm_v128_store(&L[IDX3(i, j, k, width, height)], min(L1, L2, 0, 1, 0));
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
            for (int i = 0; i < width; i+=4) {
                L_t *L1 = &L[IDX3(i, j, k  , width, height)];
                L_t *L2 = &L[IDX3(i, j+1, k, width, height)];
                wasm_v128_store(&L[IDX3(i, j, k, width, height)], min(L1, L2, 0, 1, 0));
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
        }, 0.5/depth);
    }
}

void hullmarch(unsigned char *volume, L_t *L, int width, int height, int depth, unsigned char target) {
    for (int k = 0; k < depth; ++k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                L[IDX3(i  , j  , k  , width, height)].x = 4095;
                L[IDX3(i  , j  , k  , width, height)].y = 4095;
                L[IDX3(i  , j  , k  , width, height)].z =  255;
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

unsigned char * danielsson(unsigned char *volume, int width, int height, int depth, unsigned char target) {
    std::vector<L_t> L(width*height*depth);
    
    hullmarch(volume, L.data(), width, height, depth, target);

    sweep(L.data(), width, height, depth);

    std::vector<unsigned char> sdf(width*height*depth);

    for (int k = 0; k < depth; ++k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                L_t L0 = L[IDX3(i, j, k, width, height)];

                float vx2 = voxelSize[0]*voxelSize[0];
                float vy2 = voxelSize[1]*voxelSize[1];
                float vz2 = voxelSize[1]*voxelSize[2];
                float dist = sqrt(vx2*L0.x*L0.x+vy2*L0.y*L0.y+vz2*L0.z*L0.z);
                if (volume[IDX3(i, j, k, width, height)] == target) dist *= -1.0;
                sdf[IDX3(i, j, k, width, height)] = (unsigned char)fmax(fmin((dist + 5.0) * 10.0, 255.0), 0.0);
            } 
        }
    }

    unsigned char *data = sdf.data();
    return data;
}