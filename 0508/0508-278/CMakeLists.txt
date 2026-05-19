cmake_minimum_required(VERSION 3.15)
project(PBDSoftRobot VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

find_package(OpenGL REQUIRED)
find_package(GLUT REQUIRED)

include_directories(
    ${CMAKE_SOURCE_DIR}/include
    ${OPENGL_INCLUDE_DIRS}
    ${GLUT_INCLUDE_DIRS}
)

file(GLOB_RECURSE SOURCES
    ${CMAKE_SOURCE_DIR}/src/*.cpp
    ${CMAKE_SOURCE_DIR}/src/*.h
)

file(GLOB_RECURSE HEADERS
    ${CMAKE_SOURCE_DIR}/include/*.h
)

add_executable(${PROJECT_NAME}
    ${SOURCES}
    ${HEADERS}
)

target_link_libraries(${PROJECT_NAME}
    ${OPENGL_LIBRARIES}
    ${GLUT_LIBRARIES}
)

if(MSVC)
    target_compile_options(${PROJECT_NAME} PRIVATE /W4)
else()
    target_compile_options(${PROJECT_NAME} PRIVATE -Wall -Wextra -pedantic)
endif()
