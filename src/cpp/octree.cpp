extern "C" {
  int create_octree(unsigned char *array,
                            unsigned int img_width,
                            unsigned int img_height,
                            unsigned int img_depth,
                            unsigned int tree_size);
}

// Implementation.

#include <stdio.h>
#include <vector>

#include <emscripten.h>

struct Octree;

#define min(x, y) (x < y ? x : y)
#define max(x, y) (x > y ? x : y)

int volume = 0;
float progress = 0.0;

struct Octree {
  std::vector<int32_t> data;

  
  void start(unsigned char *array,
              unsigned int img_width,
              unsigned int img_height,
              unsigned int img_depth,
              unsigned int posx,
              unsigned int posy,
              unsigned int posz,
              unsigned int size) {
      for (int i = 0; i < 8; ++i) {
        data.push_back(NULL);
      }
      for (int i = 0; i < 8; ++i) {
        unsigned int cposx = posx + ((i & 0b001) >> 0) * size/2;
        unsigned int cposy = posy + ((i & 0b010) >> 1) * size/2;
        unsigned int cposz = posz + ((i & 0b100) >> 2) * size/2;
        insert(i, array, img_width, img_height, img_depth, cposx, cposy, cposz, size/2);
      }
    }

  void insert(unsigned int index,
              unsigned char *array,
              unsigned int img_width,
              unsigned int img_height,
              unsigned int img_depth,
              unsigned int posx,
              unsigned int posy,
              unsigned int posz,
              unsigned int size) {

    if (posx > img_width || posy > img_height || posz > img_depth) {
      data[index] = 0;
      return;
    }

    unsigned int minValue = array[(posz * img_height + posy) * img_width + posx];
    unsigned int maxValue = minValue;

    unsigned int maxx = min(posx + size, img_width);
    unsigned int maxy = min(posy + size, img_height);
    unsigned int maxz = min(posz + size, img_depth);
    for (int k = posz; k < maxz; ++k) { // z
      for (int j = posy; j < maxy; ++j) { // y
        for (int i = posx; i < maxx; ++i) { // x
          unsigned int idx = (k * img_height + j) * img_width + i;
          unsigned int value = array[idx];
          minValue = min(value, minValue);
          maxValue = max(value, maxValue);

          if (minValue != maxValue) goto exitLoop;
        }
      }
    }
    exitLoop:

    if (minValue == maxValue) {
      data[index] = maxValue;
      volume += size*size*size;
      float new_progress = (float)volume / (img_width * img_height * img_depth);
      if (floor(new_progress) > progress) {
        EM_ASM({
          postMessage(['progress', $0]);
        }, progress);
      };
      progress = new_progress;
    } else {
      data[index] = -data.size() / 8;
      for (int i = 0; i < 8; ++i) {
        data.push_back(NULL);
      }
      for (int i = 0; i < 8; ++i) {
        unsigned int cposx = posx + ((i & 0b001) >> 0) * size/2;
        unsigned int cposy = posy + ((i & 0b010) >> 1) * size/2;
        unsigned int cposz = posz + ((i & 0b100) >> 2) * size/2;
        insert(data.size() - 8 + i, array, img_width, img_height, img_depth, cposx, cposy, cposz, size/2);
      }
    }
  }
};

int create_octree(unsigned char *array,
                    unsigned int img_width,
                    unsigned int img_height,
                    unsigned int img_depth,
                    unsigned int tree_size) {
  int nodes = 1;
  Octree *oct = new Octree;
  oct->insert(0, array, img_width, img_height, img_depth, 0, 0, 0, tree_size);

  return sizeof(int32_t) * oct->data.size();
};