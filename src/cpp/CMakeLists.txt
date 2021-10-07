cmake_minimum_required(VERSION 3.0)
project(PanVisionVisCpp)

set(CMAKE_CXX_FLAGS "-O3")

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ../workers)

add_executable(sdf sdf.cpp)
set_target_properties(sdf PROPERTIES LINK_FLAGS "-s MODULARIZE=1 -s EXPORT_NAME=Sdf -s ALLOW_MEMORY_GROWTH=1 --bind")

add_executable(local_heatmap local_heatmap.cpp)
set_target_properties(local_heatmap PROPERTIES LINK_FLAGS "-s MODULARIZE=1 -s EXPORT_NAME=LocalHeatmap -s ALLOW_MEMORY_GROWTH=1 --bind")

add_executable(curv curv.cpp)
set_target_properties(curv PROPERTIES LINK_FLAGS "-s MODULARIZE=1 -s EXPORT_NAME=Curv -s ALLOW_MEMORY_GROWTH=1 --bind")