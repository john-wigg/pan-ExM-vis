#include <vector>
#include <array>
#include <math.h>
#include <stdio.h>
#include <emscripten.h>
#include <emscripten/bind.h>

using namespace emscripten;

val local_heatmap(const val sdf, const val curv, const val protein, const val selection, int width, int height, int depth);


#define IDX2(i, j, w) ((i)+(j)*(w))
#define IDX3(i, j, k, w, h) ((i)+(j)*(w)+(k)*(w)*(h))

val local_heatmap(const val sdf, const val curv, const val protein, const val selection, int width, int height, int depth) {
    std::vector<unsigned char> sdf_data = convertJSArrayToNumberVector<unsigned char>(sdf);
    std::vector<unsigned char> curv_data = convertJSArrayToNumberVector<unsigned char>(curv);
    std::vector<unsigned char> protein_data = convertJSArrayToNumberVector<unsigned char>(protein);
    std::vector<unsigned char> selection_data = convertJSArrayToNumberVector<unsigned char>(selection);

    std::vector<float> count(256*256);
    std::vector<float> area(256*256);

    for (int k = 0; k < depth; ++k) {
        for (int j = 0; j < height; ++j) {
            for (int i = 0; i < width; ++i) {
                int index3 = IDX3(i, j, k, width, height);
                int index2 = IDX2(i, j, width);

                unsigned char selection_val = selection_data[4 * index2];
                if (selection_val < 128) continue;

                int indexHM = IDX2(sdf_data[index3], curv_data[index3], 256);

                count[indexHM] += protein_data[2*index3];
                area[indexHM] += 1.0;
            }
        }
    }

    count.insert( count.end(), area.begin(), area.end() );

    return val{  typed_memory_view(count.size(), count.data()) };
}

EMSCRIPTEN_BINDINGS(module) {
    function("local_heatmap", &local_heatmap);
}