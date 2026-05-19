cmake_minimum_required(VERSION 3.20)
project(VideoEditorSDK VERSION 1.0.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

option(BUILD_SHARED_LIBS "Build shared libraries" ON)
option(VE_BUILD_TESTS "Build tests" OFF)
option(VE_BUILD_EXAMPLES "Build examples" OFF)
option(VE_BUILD_CAPI "Build C API" ON)
option(VE_BUILD_JNI "Build JNI" OFF)
option(VE_BUILD_OBJC "Build Objective-C" OFF)

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_CURRENT_SOURCE_DIR}/cmake")

find_package(OpenGL REQUIRED)

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${OPENGL_INCLUDE_DIR}
)

set(VE_CORE_SOURCES
    src/core/ve.cpp
    src/core/editor.cpp
    src/decoder/ffmpeg_decoder.cpp
    src/encoder/ffmpeg_encoder.cpp
    src/renderer/gl_renderer.cpp
    src/renderer/filter_chain.cpp
    src/renderer/shaders.cpp
    src/transitions/transitions.cpp
    src/audio/audio_mixer.cpp
    src/utils/logger.cpp
    src/utils/timer.cpp
)

if(APPLE AND VE_BUILD_OBJC)
    list(APPEND VE_CORE_SOURCES src/platform/apple/VEVideoEditor.mm)
    set_source_files_properties(src/platform/apple/VEVideoEditor.mm PROPERTIES
        COMPILE_FLAGS "-fobjc-arc")
endif()

if(ANDROID AND VE_BUILD_JNI)
    list(APPEND VE_CORE_SOURCES src/platform/android/ve_jni.cpp)
endif()

add_library(ve ${VE_CORE_SOURCES})

target_compile_definitions(ve PRIVATE VE_EXPORTS)

target_link_libraries(ve
    ${OPENGL_LIBRARIES}
)

if(WIN32)
    target_link_libraries(ve opengl32 gdi32 ws2_32)
endif()

if(APPLE)
    target_link_libraries(ve
        "-framework CoreVideo"
        "-framework CoreMedia"
        "-framework Foundation"
        "-framework CoreGraphics"
    )
endif()

if(VE_BUILD_CAPI)
    target_sources(ve PRIVATE src/platform/c/ve_capi.cpp)
endif()

set_target_properties(ve PROPERTIES
    VERSION ${PROJECT_VERSION}
    SOVERSION 1
)

install(TARGETS ve
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
    RUNTIME DESTINATION bin
    PUBLIC_HEADER DESTINATION include/ve
)

install(DIRECTORY include/ve/ DESTINATION include/ve)

if(VE_BUILD_EXAMPLES)
    add_subdirectory(examples)
endif()

if(VE_BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()

message(STATUS "VideoEditor SDK v${PROJECT_VERSION}")
message(STATUS "  Build shared: ${BUILD_SHARED_LIBS}")
message(STATUS "  Build C API: ${VE_BUILD_CAPI}")
message(STATUS "  Build JNI: ${VE_BUILD_JNI}")
message(STATUS "  Build ObjC: ${VE_BUILD_OBJC}")
