cmake_minimum_required(VERSION 3.18)
project(mediapipe_hand_tracking_sdk VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

option(BUILD_PYTHON_BINDINGS "Build Python bindings" ON)
option(BUILD_EXAMPLES "Build example applications" ON)
option(USE_INT8_QUANTIZATION "Enable INT8 quantization" ON)
option(BUILD_ANDROID "Build for Android" OFF)
option(BUILD_IOS "Build for iOS" OFF)

if(USE_INT8_QUANTIZATION)
    add_definitions(-DUSE_INT8_QUANTIZATION)
endif()

include_directories(${CMAKE_SOURCE_DIR}/include)
include_directories(${CMAKE_SOURCE_DIR}/third_party/mediapipe)
include_directories(${CMAKE_SOURCE_DIR}/third_party/opencv/include)

add_subdirectory(src)

if(BUILD_PYTHON_BINDINGS)
    add_subdirectory(python)
endif()

if(BUILD_EXAMPLES)
    add_subdirectory(examples)
endif()

enable_testing()
add_subdirectory(tests)
