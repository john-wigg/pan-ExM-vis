#include <vector>
#include <array>
#include <math.h>
#include <stdio.h>
#include <emscripten.h>
#include <wasm_simd128.h>

extern "C" {
  unsigned char * jfa3(unsigned char *volume, int width, int height, int depth, int start, int stop, unsigned char target);
}

#define min(x, y) (x < y ? x : y)
#define max(x, y) (x > y ? x : y)

// Hardcoded (for now) z/x (or z/y) voxel aspect.
const float voxelSize[3] = { 0.24, 0.24, 0.2999309 };

unsigned char * jfa3(unsigned char *volume, int width, int height, int depth, int start, int stop, unsigned char target) {
    int d = stop - start;

    std::vector<unsigned char> sdf(width * height * d, 0);

    // Stores the sites of the current slice.
    // A site contains:
    // - the x and y coordinates of the seed site
    // - the z distance from the seed site

    // Times 9 for SIMD padding.
    std::vector<float> sites_x(height*width*9, 9999.9);
    std::vector<float> sites_y(height*width*9, 9999.9);
    std::vector<float> sites_z(height*width*9, 9999.9);

    std::vector<float> sites_x_tmp(height*width*9, 9999.9);
    std::vector<float> sites_y_tmp(height*width*9, 9999.9);
    std::vector<float> sites_z_tmp(height*width*9, 9999.9);

    // Stores the z-distances to the next sign change in either direction.
    std::vector<float> lo_zdist(height*width, 9999.9);
    std::vector<float> up_zdist(height*width, 9999.9);

    // Bitmask for determining whether a pixel is inside or outside.
    std::vector<bool> inside(height*width*9, false);


    int n = max(width, height);

    int pad = 3*height*width + width; // Skip upper padding and padding on first row.

    // Initialise bitmask.
    for (int j = 0; j < height; ++j) {
        for (int i = 0; i < width; ++i) {
            inside[pad+i+j*3*width] = (volume[i+j*width] == target);
        }
    }

    // Initialise the upper z-distance.
    for (int j = 0; j < height; ++j) {
        for (int i = 0; i < width; ++i) {
            int k;
            for (k = start; k < depth; ++k) {
                if (inside[pad+i+j*3*width] != (volume[i + j * width + k * width*height] == target)) {
                    up_zdist[j * width + i] = k - start;
                    break;
                }
            } 
        }
    }

    // Initialise the lower z-distance.
    for (int j = 0; j < height; ++j) {
        for (int i = 0; i < width; ++i) {
            int k;
            for (k = start; k >= 0; --k) {
                if (inside[pad+i+j*3*width] != (volume[i + j * width + k * width*height] == target)) {
                    lo_zdist[j * width + i] = start - k;
                    break;
                } 
            }
        }
    }

    for (int slice = start; slice < stop; ++slice) { // Iterate over each slice (main outer loop).

        // Update the z-distances in both directions as well as bitmask.
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                inside[pad+i+j*3*width] = (volume[(slice * height + j) * width + i] == target);
                --up_zdist[j*width+i];
                ++lo_zdist[j*width+i];

                if (up_zdist[j*width+i] < 0) {
                    // Search for new upper dist.
                    lo_zdist[j*width+i] = 1.0;
                    up_zdist[j * width + i] = 9999.9;
                    int k;
                    for (k = slice; k < depth; ++k) {
                        if (inside[pad+i+j*3*width] != (volume[i + j * width + k * width*height] == target)) { // AND THIS DOESNT WORK EITHER :(
                            up_zdist[j * width + i] = k - slice;
                            break;
                        }
                    }  
                }

                sites_x[pad + j*3*width+i] = i;
                sites_y[pad + j*3*width+i] = j;
                sites_z[pad + j*3*width+i] = min(up_zdist[j*width+i], lo_zdist[j*width+i]);
                if (inside[pad+i+j*3*width]) sites_z[pad + j*3*width+i] = 9999.9;
            }
        }

        // 2. Run JFA on the slice
        for (int s = n; s > 0; s = s >> 1) {

            for (int j = 0; j < height; ++j) {
                for (int i = 0; i < width; i += 4) {
                    int center = pad + j*3*width+i;

                    v128_t v_i = wasm_f32x4_make(i, i+1, i+2, i+3);
                    v128_t v_j = wasm_f32x4_splat(j);

                    v128_t v_inside = wasm_i32x4_gt(wasm_i32x4_make(inside[center], inside[center+1], inside[center+2], inside[center+3]), wasm_i32x4_splat(0));
                    v128_t v_linside = wasm_i32x4_gt(wasm_i32x4_make(inside[center-s], inside[center-s+1], inside[center-s+2], inside[center-s+3]), wasm_i32x4_splat(0));
                    v128_t v_rinside = wasm_i32x4_gt(wasm_i32x4_make(inside[center+s], inside[center+s+1], inside[center+s+2], inside[center+s+3]), wasm_i32x4_splat(0));

                    v128_t v_cx = wasm_v128_load(&sites_x[center]);
                    v128_t v_cy = wasm_v128_load(&sites_y[center]);
                    v128_t v_cz = wasm_v128_load(&sites_z[center]);

                    if (wasm_i32x4_all_true(v_inside)) {
                        wasm_v128_store(&sites_x_tmp[center], v_cx);
                        wasm_v128_store(&sites_y_tmp[center], v_cy);
                        wasm_v128_store(&sites_z_tmp[center], wasm_f32x4_splat(0));
                        continue;
                    }

                    v128_t v_lx = wasm_v128_load(&sites_x[center-s]);
                    v128_t v_ly = wasm_v128_load(&sites_y[center-s]);
                    v128_t v_lz = wasm_v128_load(&sites_z[center-s]);

                    v128_t v_rx = wasm_v128_load(&sites_x[center+s]);
                    v128_t v_ry = wasm_v128_load(&sites_y[center+s]);
                    v128_t v_rz = wasm_v128_load(&sites_z[center+s]);

                    v_lx = wasm_v128_bitselect(wasm_f32x4_make(i-s, i-s+1, i-s+2, i-s+3), v_lx, v_linside);
                    v_rx = wasm_v128_bitselect(wasm_f32x4_make(i+s, i+s+1, i+s+2, i+s+3), v_rx, v_rinside);

                    v_ly = wasm_v128_bitselect(v_j, v_ly, v_linside);
                    v_ry = wasm_v128_bitselect(v_j, v_ry, v_rinside);

                    v_lz = wasm_v128_bitselect(wasm_f32x4_splat(0.0), v_lz, v_linside);
                    v_rz = wasm_v128_bitselect(wasm_f32x4_splat(0.0), v_rz, v_rinside);

                    v128_t v_sx = wasm_f32x4_splat(voxelSize[0]);
                    v128_t v_sy = wasm_f32x4_splat(voxelSize[1]);
                    v128_t v_sz = wasm_f32x4_splat(voxelSize[2]);

                    v128_t v_ldx = wasm_f32x4_mul(wasm_f32x4_sub(v_lx, v_i), v_sx);
                    v128_t v_rdx = wasm_f32x4_mul(wasm_f32x4_sub(v_rx, v_i), v_sx);
                    v128_t v_cdx = wasm_f32x4_mul(wasm_f32x4_sub(v_cx, v_i), v_sx);

                    v128_t v_ldy = wasm_f32x4_mul(wasm_f32x4_sub(v_ly, v_j), v_sy);
                    v128_t v_rdy = wasm_f32x4_mul(wasm_f32x4_sub(v_ry, v_j), v_sy);
                    v128_t v_cdy = wasm_f32x4_mul(wasm_f32x4_sub(v_cy, v_j), v_sy);

                    v128_t v_ldz = wasm_f32x4_mul(v_lz, v_sz);
                    v128_t v_rdz = wasm_f32x4_mul(v_rz, v_sz);
                    v128_t v_cdz = wasm_f32x4_mul(v_cz, v_sz);

                    v128_t v_ldx2 = wasm_f32x4_mul(v_ldx, v_ldx);
                    v128_t v_rdx2 = wasm_f32x4_mul(v_rdx, v_rdx);
                    v128_t v_cdx2 = wasm_f32x4_mul(v_cdx, v_cdx);

                    v128_t v_ldy2 = wasm_f32x4_mul(v_ldy, v_ldy);
                    v128_t v_rdy2 = wasm_f32x4_mul(v_rdy, v_rdy);
                    v128_t v_cdy2 = wasm_f32x4_mul(v_cdy, v_cdy);

                    v128_t v_ldz2 = wasm_f32x4_mul(v_ldz, v_ldz);
                    v128_t v_rdz2 = wasm_f32x4_mul(v_rdz, v_rdz);
                    v128_t v_cdz2 = wasm_f32x4_mul(v_cdz, v_cdz);

                    v128_t v_ld = wasm_f32x4_add(wasm_f32x4_add(v_ldx2, v_ldy2), v_ldz2);
                    v128_t v_rd = wasm_f32x4_add(wasm_f32x4_add(v_rdx2, v_rdy2), v_rdz2);
                    v128_t v_cd = wasm_f32x4_add(wasm_f32x4_add(v_cdx2, v_cdy2), v_cdz2);

                    v128_t v_x = wasm_v128_bitselect(v_lx, v_rx, wasm_f32x4_lt(v_ld, v_rd));
                    v128_t v_y = wasm_v128_bitselect(v_ly, v_ry, wasm_f32x4_lt(v_ld, v_rd));
                    v128_t v_z = wasm_v128_bitselect(v_lz, v_rz, wasm_f32x4_lt(v_ld, v_rd));
                    v128_t v_d = wasm_v128_bitselect(v_ld, v_rd, wasm_f32x4_lt(v_ld, v_rd));

                    v_x = wasm_v128_bitselect(v_x, v_cx, wasm_f32x4_lt(v_d, v_cd));
                    v_y = wasm_v128_bitselect(v_y, v_cy, wasm_f32x4_lt(v_d, v_cd));
                    v_z = wasm_v128_bitselect(v_z, v_cz, wasm_f32x4_lt(v_d, v_cd));

                    v_x = wasm_v128_bitselect(v_cx, v_x, v_inside);
                    v_y = wasm_v128_bitselect(v_cy, v_y, v_inside);
                    v_z = wasm_v128_bitselect(wasm_f32x4_splat(0.0), v_z, v_inside);

                    wasm_v128_store(&sites_x_tmp[center], v_x);
                    wasm_v128_store(&sites_y_tmp[center], v_y);
                    wasm_v128_store(&sites_z_tmp[center], v_z);
                }
            }
            

            sites_x.swap(sites_x_tmp);
            sites_y.swap(sites_y_tmp);
            sites_z.swap(sites_z_tmp);
            
            for (int j = 0; j < height; ++j) {
                for (int i = 0; i < width; i += 4) {
                    int center = pad + j*3*width+i;

                    v128_t v_i = wasm_f32x4_make(i, i+1, i+2, i+3);
                    v128_t v_j = wasm_f32x4_splat(j);

                    v128_t v_inside = wasm_i32x4_gt(wasm_i32x4_make(inside[center], inside[center+1], inside[center+2], inside[center+3]), wasm_i32x4_splat(0));
                    v128_t v_linside = wasm_i32x4_gt(wasm_i32x4_make(inside[center-3*width*s], inside[center-3*width*s+1], inside[center-3*width*s+2], inside[center-3*width*s+3]), wasm_i32x4_splat(0));
                    v128_t v_rinside = wasm_i32x4_gt(wasm_i32x4_make(inside[center+3*width*s], inside[center+3*width*s+1], inside[center+3*width*s+2], inside[center+3*width*s+3]), wasm_i32x4_splat(0));
                    v128_t v_cx = wasm_v128_load(&sites_x[center]);
                    v128_t v_cy = wasm_v128_load(&sites_y[center]);
                    v128_t v_cz = wasm_v128_load(&sites_z[center]);

                    if (wasm_i32x4_all_true(v_inside)) {
                        wasm_v128_store(&sites_x_tmp[center], v_cx);
                        wasm_v128_store(&sites_y_tmp[center], v_cy);
                        wasm_v128_store(&sites_z_tmp[center], wasm_f32x4_splat(0));
                        continue;
                    }

                    v128_t v_lx = wasm_v128_load(&sites_x[center-3*width*s]);
                    v128_t v_ly = wasm_v128_load(&sites_y[center-3*width*s]);
                    v128_t v_lz = wasm_v128_load(&sites_z[center-3*width*s]);

                    v128_t v_rx = wasm_v128_load(&sites_x[center+3*width*s]);
                    v128_t v_ry = wasm_v128_load(&sites_y[center+3*width*s]);
                    v128_t v_rz = wasm_v128_load(&sites_z[center+3*width*s]);

                    v_lx = wasm_v128_bitselect(v_i, v_lx, v_linside);
                    v_rx = wasm_v128_bitselect(v_i, v_rx, v_rinside);

                    v_ly = wasm_v128_bitselect(wasm_f32x4_splat(j-s), v_ly, v_linside);
                    v_ry = wasm_v128_bitselect(wasm_f32x4_splat(j+s), v_ry, v_rinside);

                    v_lz = wasm_v128_bitselect(wasm_f32x4_splat(0.0), v_lz, v_linside);
                    v_rz = wasm_v128_bitselect(wasm_f32x4_splat(0.0), v_rz, v_rinside);

                    v128_t v_sx = wasm_f32x4_splat(voxelSize[0]);
                    v128_t v_sy = wasm_f32x4_splat(voxelSize[1]);
                    v128_t v_sz = wasm_f32x4_splat(voxelSize[2]);

                    v128_t v_ldx = wasm_f32x4_mul(wasm_f32x4_sub(v_lx, v_i), v_sx);
                    v128_t v_rdx = wasm_f32x4_mul(wasm_f32x4_sub(v_rx, v_i), v_sx);
                    v128_t v_cdx = wasm_f32x4_mul(wasm_f32x4_sub(v_cx, v_i), v_sx);

                    v128_t v_ldy = wasm_f32x4_mul(wasm_f32x4_sub(v_ly, v_j), v_sy);
                    v128_t v_rdy = wasm_f32x4_mul(wasm_f32x4_sub(v_ry, v_j), v_sy);
                    v128_t v_cdy = wasm_f32x4_mul(wasm_f32x4_sub(v_cy, v_j), v_sy);

                    v128_t v_ldz = wasm_f32x4_mul(v_lz, v_sz);
                    v128_t v_rdz = wasm_f32x4_mul(v_rz, v_sz);
                    v128_t v_cdz = wasm_f32x4_mul(v_cz, v_sz);

                    v128_t v_ldx2 = wasm_f32x4_mul(v_ldx, v_ldx);
                    v128_t v_rdx2 = wasm_f32x4_mul(v_rdx, v_rdx);
                    v128_t v_cdx2 = wasm_f32x4_mul(v_cdx, v_cdx);

                    v128_t v_ldy2 = wasm_f32x4_mul(v_ldy, v_ldy);
                    v128_t v_rdy2 = wasm_f32x4_mul(v_rdy, v_rdy);
                    v128_t v_cdy2 = wasm_f32x4_mul(v_cdy, v_cdy);

                    v128_t v_ldz2 = wasm_f32x4_mul(v_ldz, v_ldz);
                    v128_t v_rdz2 = wasm_f32x4_mul(v_rdz, v_rdz);
                    v128_t v_cdz2 = wasm_f32x4_mul(v_cdz, v_cdz);

                    v128_t v_ld = wasm_f32x4_add(wasm_f32x4_add(v_ldx2, v_ldy2), v_ldz2);
                    v128_t v_rd = wasm_f32x4_add(wasm_f32x4_add(v_rdx2, v_rdy2), v_rdz2);
                    v128_t v_cd = wasm_f32x4_add(wasm_f32x4_add(v_cdx2, v_cdy2), v_cdz2);

                    v128_t v_x = wasm_v128_bitselect(v_lx, v_rx, wasm_f32x4_lt(v_ld, v_rd));
                    v128_t v_y = wasm_v128_bitselect(v_ly, v_ry, wasm_f32x4_lt(v_ld, v_rd));
                    v128_t v_z = wasm_v128_bitselect(v_lz, v_rz, wasm_f32x4_lt(v_ld, v_rd));
                    v128_t v_d = wasm_v128_bitselect(v_ld, v_rd, wasm_f32x4_lt(v_ld, v_rd));

                    v_x = wasm_v128_bitselect(v_x, v_cx, wasm_f32x4_lt(v_d, v_cd));
                    v_y = wasm_v128_bitselect(v_y, v_cy, wasm_f32x4_lt(v_d, v_cd));
                    v_z = wasm_v128_bitselect(v_z, v_cz, wasm_f32x4_lt(v_d, v_cd));

                    v_x = wasm_v128_bitselect(v_cx, v_x, v_inside);
                    v_y = wasm_v128_bitselect(v_cy, v_y, v_inside);
                    v_z = wasm_v128_bitselect(wasm_f32x4_splat(0.0), v_z, v_inside);

                    wasm_v128_store(&sites_x_tmp[center], v_x);
                    wasm_v128_store(&sites_y_tmp[center], v_y);
                    wasm_v128_store(&sites_z_tmp[center], v_z);
                }
            }

            sites_x.swap(sites_x_tmp);
            sites_y.swap(sites_y_tmp);
            sites_z.swap(sites_z_tmp);
        }
        
        for (int j = 0; j < height; j++) {
            for (int i = 0; i < width; i++) {
                int idx = pad + i + j * 3 * width;
                float dx = voxelSize[0]*(sites_x[idx] - i);
                float dy = voxelSize[1]*(sites_y[idx] - j);
                float dz = voxelSize[2]*sites_z[idx];
                float dist = sqrt(dx*dx+dy*dy+dz*dz);
                sdf[width * j + i + (slice - start) * width * height] = (unsigned char)(min(dist * 10.0, 255.0));
            }
        }

        EM_ASM({
            postMessage(['progress', $0]);
        }, 1.0 / depth);
    }

    unsigned char *data = sdf.data();
    return data;
}