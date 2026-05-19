cmake_minimum_required(VERSION 3.15)
project(PaxosKV CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

if(MSVC)
    set(CMAKE_CXX_FLAGS_RELEASE "/O2 /DNDEBUG /GL /Oi /Ot /GS-")
    set(CMAKE_CXX_FLAGS_DEBUG "/Od /DDEBUG /Zi")
else()
    set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG -march=native -flto -ffast-math")
    set(CMAKE_CXX_FLAGS_DEBUG "-g -O0 -DDEBUG")
endif()

find_package(Threads REQUIRED)
find_package(gRPC CONFIG REQUIRED)
find_package(Protobuf CONFIG REQUIRED)
find_package(RocksDB CONFIG REQUIRED)
find_package(spdlog CONFIG REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(GTest CONFIG REQUIRED)

include_directories(
    ${CMAKE_SOURCE_DIR}/include
    ${CMAKE_SOURCE_DIR}/src
    ${CMAKE_BINARY_DIR}
)

add_subdirectory(proto)

file(GLOB_RECURSE COMMON_SOURCES "src/common/*.cpp")
file(GLOB_RECURSE PAXOS_SOURCES "src/paxos/*.cpp")
file(GLOB_RECURSE KV_SOURCES "src/kv/*.cpp")
file(GLOB_RECURSE RPC_SOURCES "src/rpc/*.cpp")

add_library(paxos_kv_lib STATIC
    ${COMMON_SOURCES}
    ${PAXOS_SOURCES}
    ${KV_SOURCES}
    ${RPC_SOURCES}
)

target_link_libraries(paxos_kv_lib
    PUBLIC
        paxos_kv_proto
        gRPC::grpc++
        protobuf::libprotobuf
        RocksDB::rocksdb
        spdlog::spdlog
        OpenSSL::SSL
        OpenSSL::Crypto
        Threads::Threads
)

add_executable(paxos_kv_server src/server_main.cpp)
target_link_libraries(paxos_kv_server PRIVATE paxos_kv_lib)

add_executable(paxos_kv_client src/client_main.cpp)
target_link_libraries(paxos_kv_client PRIVATE paxos_kv_lib)
