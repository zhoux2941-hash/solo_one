cmake_minimum_required(VERSION 3.10)
project(VehicleInference)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ONNX Runtime路径 - 根据实际安装位置修改
set(ONNXRUNTIME_ROOT "/path/to/onnxruntime" CACHE PATH "ONNX Runtime root directory")

include_directories(${ONNXRUNTIME_ROOT}/include)
link_directories(${ONNXRUNTIME_ROOT}/lib)

add_executable(vehicle_inference cpp_inference.cpp)

if(WIN32)
    target_link_libraries(vehicle_inference onnxruntime)
else()
    target_link_libraries(vehicle_inference onnxruntime pthread)
endif()

# 针对边缘设备的编译优化
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    target_compile_options(vehicle_inference PRIVATE
        -O3
        -march=native
        -ffast-math
        -funroll-loops
    )
endif()

message(STATUS "ONNX Runtime root: ${ONNXRUNTIME_ROOT}")
