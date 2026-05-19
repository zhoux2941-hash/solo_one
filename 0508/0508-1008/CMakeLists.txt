cmake_minimum_required(VERSION 3.14)
project(MemSafetyAnalyzer LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(LLVM REQUIRED CONFIG)
find_package(Clang REQUIRED CONFIG)

message(STATUS "Found LLVM ${LLVM_PACKAGE_VERSION}")
message(STATUS "Using LLVMConfig.cmake in: ${LLVM_DIR}")

include_directories(${LLVM_INCLUDE_DIRS})
include_directories(${CLANG_INCLUDE_DIRS})
include_directories(${CMAKE_SOURCE_DIR}/include)
add_definitions(${LLVM_DEFINITIONS})
add_definitions(${CLANG_DEFINITIONS})

link_directories(${LLVM_LIBRARY_DIRS})

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fno-rtti")

set(MEMSAFETY_SOURCES
    src/MemSafetyAnalyzer.cpp
    src/AnalysisEngine.cpp
    src/NullPointerDetector.cpp
    src/UseAfterFreeDetector.cpp
    src/DoubleFreeDetector.cpp
    src/MemoryLeakDetector.cpp
    src/ReachabilityAnalysis.cpp
    src/ReportGenerator.cpp
    src/CommandLineOptions.cpp
)

add_executable(memsafety ${MEMSAFETY_SOURCES})

llvm_map_components_to_libnames(llvm_libs
    support
    core
    irreader
    analysis
    scalaropts
    transformutils
)

target_link_libraries(memsafety
    ${llvm_libs}
    clangAST
    clangBasic
    clangFrontend
    clangLex
    clangRewrite
    clangSema
    clangSerialization
    clangTooling
    clangStaticAnalyzerCore
    clangStaticAnalyzerFrontend
    clangStaticAnalyzerCheckers
)

install(TARGETS memsafety RUNTIME DESTINATION bin)
