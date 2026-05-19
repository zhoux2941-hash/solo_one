set(PROTO_FILES
    kv.proto
    paxos.proto
)

find_package(Protobuf CONFIG REQUIRED)
find_package(gRPC CONFIG REQUIRED)

add_library(paxos_kv_proto STATIC ${PROTO_FILES})

target_link_libraries(paxos_kv_proto
    PUBLIC
        protobuf::libprotobuf
        gRPC::grpc++
        gRPC::grpc++_reflection
)

protobuf_generate(TARGET paxos_kv_proto LANGUAGE cpp)
protobuf_generate(TARGET paxos_kv_proto LANGUAGE grpc 
    GENERATE_EXTENSIONS .grpc.pb.h .grpc.pb.cc
    PLUGIN "protoc-gen-grpc=\$<TARGET_FILE:gRPC::grpc_cpp_plugin>")

target_include_directories(paxos_kv_proto PUBLIC ${CMAKE_CURRENT_BINARY_DIR})
