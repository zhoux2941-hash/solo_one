cmake_minimum_required(VERSION 3.20)
project(VectorDB VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(Threads REQUIRED)
find_package(gRPC CONFIG REQUIRED)
find_package(Protobuf CONFIG REQUIRED)
find_package(GTest CONFIG REQUIRED)
find_package(fmt CONFIG REQUIRED)
find_package(absl CONFIG REQUIRED)

set(PROTO_DIR ${CMAKE_CURRENT_SOURCE_DIR}/proto)
set(GENERATED_DIR ${CMAKE_CURRENT_BINARY_DIR}/generated)
file(MAKE_DIRECTORY ${GENERATED_DIR})

set(PROTO_FILES ${PROTO_DIR}/vectordb.proto)

set(PROTO_SRCS
    ${GENERATED_DIR}/vectordb.pb.cc
    ${GENERATED_DIR}/vectordb.grpc.pb.cc)
set(PROTO_HDRS
    ${GENERATED_DIR}/vectordb.pb.h
    ${GENERATED_DIR}/vectordb.grpc.pb.h)

add_custom_command(
    OUTPUT ${PROTO_SRCS} ${PROTO_HDRS}
    COMMAND $<TARGET_FILE:protobuf::protoc>
    ARGS --grpc_out=${GENERATED_DIR}
         --cpp_out=${GENERATED_DIR}
         -I ${PROTO_DIR}
         --plugin=protoc-gen-grpc=$<TARGET_FILE:gRPC::grpc_cpp_plugin>
         ${PROTO_FILES}
    DEPENDS ${PROTO_FILES}
    COMMENT "Generating gRPC and protobuf files"
)

set(COMMON_SRCS
    src/common/vector.cpp
    src/common/distance.cpp
    src/common/perf_monitor.cpp
    src/storage/mmap_storage.cpp
)

set(SERVER_SRCS
    src/server/main.cpp
    src/server/server.cpp
    src/db/shard_manager.cpp
    src/db/shard.cpp
    src/index/hnsw_index.cpp
    src/index/ivf_pq_index.cpp
    src/index/vector_index.cpp
    ${COMMON_SRCS}
    ${PROTO_SRCS}
)

add_executable(vectordb_server ${SERVER_SRCS})

target_include_directories(vectordb_server PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${GENERATED_DIR}
)

target_link_libraries(vectordb_server PRIVATE
    gRPC::grpc++
    gRPC::grpc
    protobuf::libprotobuf
    fmt::fmt
    absl::flat_hash_map
    absl::strings
    Threads::Threads
)

set(CLIENT_SRCS
    src/client/main.cpp
    src/client/client.cpp
    ${PROTO_SRCS}
)

add_executable(vectordb_client ${CLIENT_SRCS})

target_include_directories(vectordb_client PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${GENERATED_DIR}
)

target_link_libraries(vectordb_client PRIVATE
    gRPC::grpc++
    gRPC::grpc
    protobuf::libprotobuf
    fmt::fmt
    Threads::Threads
)

enable_testing()
set(TEST_SRCS
    tests/test_distance.cpp
    tests/test_hnsw.cpp
    tests/test_ivfpq.cpp
    tests/test_shard.cpp
    tests/test_performance.cpp
    src/index/hnsw_index.cpp
    src/index/ivf_pq_index.cpp
    src/index/vector_index.cpp
    ${COMMON_SRCS}
    ${PROTO_SRCS}
)

add_executable(run_tests ${TEST_SRCS})

target_include_directories(run_tests PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${GENERATED_DIR}
)

target_link_libraries(run_tests PRIVATE
    gRPC::grpc++
    gRPC::grpc
    protobuf::libprotobuf
    fmt::fmt
    GTest::gtest
    GTest::gtest_main
    Threads::Threads
)

include(GoogleTest)
gtest_discover_tests(run_tests)
