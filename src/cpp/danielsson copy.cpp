#include <vector>
#include <array>
#include <math.h>
#include <stdio.h>
#include <emscripten.h>

extern "C" {
  unsigned char * danielsson(unsigned char *volume, unsigned char target, int width, int height, int depth, float vx, float vy, float vz);
}


#define IDX2(i, j, w) ((i)+(j)*(w))
#define IDX3(i, j, k, w, h) ((i)+(j)*(w)+(k)*(w)*(h))

// Use a bitmask to reduce the memory footprint and
// increase cache hits. Allows for max. 4096x4096x256 stacks.
typedef struct L_t { 
    unsigned x:12;
    unsigned y:12;
    unsigned z:8;
} L_t;

L_t min(L_t L1, L_t L2, float vx2, float vy2, float vz2) {
    float d1 = vx2*L1.x*L1.x+vy2*L1.y*L1.y+vz2*L1.z*L1.z;
    float d2 = vx2*L2.x*L2.x+vy2*L2.y*L2.y+vz2*L2.z*L2.z;
    return (d1 < d2) ? L1 : L2;
}

void sweep(L_t *L, int width, int height, int depth, float vx2, float vy2, float vz2) {
    for (int k = 1; k < depth; ++k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i, j, k-1, width, height)];
                L2.z += 1;
                L[IDX3(i, j, k, width, height)] = min(L1, L2, vx2, vy2, vz2);

                if (j > 0) {
                    L_t L1 = L[IDX3(i, j, k  , width, height)];
                    L_t L2 = L[IDX3(i, j-1, k, width, height)];
                    L2.y += 1;
                    L[IDX3(i, j, k  , width, height)] = min(L1, L2, vx2, vy2, vz2);

                    if (i > 0) {
                        L_t L1 = L[IDX3(i, j, k  , width, height)];
                        L_t L2 = L[IDX3(i-1, j, k, width, height)];
                        L2.x += 1;
                        L[IDX3(i, j, k  , width, height)] = min(L1, L2, vx2, vy2, vz2);
                    }
                }
            }
        }

        for (int j = 1; j < height; ++j) {
            for (int i = width-2; i >= 0; --i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i+1, j, k, width, height)];
                L2.x += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2, vx2, vy2, vz2);
            }
        }

        for (int j = height-2; j >= 0; --j) {
            for (int i = 0; i < width; ++i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i, j+1, k, width, height)];
                L2.y += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2, vx2, vy2, vz2);

                if (i > 1) {
                    L_t L1 = L[IDX3(i, j, k  , width, height)];
                    L_t L2 = L[IDX3(i-1, j, k, width, height)];
                    L2.x += 1;
                    L[IDX3(i, j, k  , width, height)] = min(L1, L2, vx2, vy2, vz2);
                }
            }

            for (int i = width-2; i >= 0; --i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i+1, j, k, width, height)];
                L2.x += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2, vx2, vy2, vz2);
            }
        }

        EM_ASM({
            postMessage(['progress', $0]);
        }, 0.5/depth);
    }
    
    for (int k = depth-2; k >= 0; --k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i, j, k+1, width, height)];
                L2.z += 1;
                L[IDX3(i, j, k, width, height)] = min(L1, L2, vx2, vy2, vz2);

                if (j > 1) {
                    L_t L1 = L[IDX3(i, j, k  , width, height)];
                    L_t L2 = L[IDX3(i, j-1, k, width, height)];
                    L2.y += 1;
                    L[IDX3(i, j, k  , width, height)] = min(L1, L2, vx2, vy2, vz2);

                    if (i > 1) {
                        L_t L1 = L[IDX3(i, j, k  , width, height)];
                        L_t L2 = L[IDX3(i-1, j, k, width, height)];
                        L2.x += 1;
                        L[IDX3(i, j, k  , width, height)] = min(L1, L2, vx2, vy2, vz2);
                    }
                }
            }
        }

        for (int j = 1; j < height; ++j) {
            for (int i = width-2; i >= 0; --i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i+1, j, k, width, height)];
                L2.x += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2, vx2, vy2, vz2);
            }
        }

        for (int j = height-2; j >= 0; --j) {
            for (int i = 0; i < width; ++i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i, j+1, k, width, height)];
                L2.y += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2, vx2, vy2, vz2);

                if (i > 0) {
                    L_t L1 = L[IDX3(i, j, k  , width, height)];
                    L_t L2 = L[IDX3(i-1, j, k, width, height)];
                    L2.x += 1;
                    L[IDX3(i, j, k  , width, height)] = min(L1, L2, vx2, vy2, vz2);
                }
            }

            for (int i = width-2; i >= 0; --i) {
                L_t L1 = L[IDX3(i, j, k  , width, height)];
                L_t L2 = L[IDX3(i+1, j, k, width, height)];
                L2.x += 1;
                L[IDX3(i, j, k  , width, height)] = min(L1, L2, vx2, vy2, vz2);
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

unsigned char * danielsson(unsigned char *volume, unsigned char target, int width, int height, int depth, float vx, float vy, float vz) {
    float vx2 = vx*vx;
    float vy2 = vy*vy;
    float vz2 = vz*vz;

    std::vector<L_t> L(width*height*depth);
    
    hullmarch(volume, L.data(), width, height, depth, target);

    sweep(L.data(), width, height, depth, vx2, vy2, vz2);

    std::vector<unsigned char> sdf(width*height*depth);

    for (int k = 0; k < depth; ++k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                L_t L0 = L[IDX3(i, j, k, width, height)];

                float dist = sqrt(vx2*L0.x*L0.x+vy2*L0.y*L0.y+vz2*L0.z*L0.z);
                if (volume[IDX3(i, j, k, width, height)] == target) dist *= -1.0;
                sdf[IDX3(i, j, k, width, height)] = (unsigned char)fmax(fmin((dist + 5.0) * 10.0, 255.0), 0.0);
            } 
        }
    }

    unsigned char *data = sdf.data();
    return data;
}