cmake_minimum_required(VERSION 3.15)
project(ReliableUDP VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(MSVC)
    add_compile_options(/W4 /O2)
else()
    add_compile_options(-Wall -Wextra -Wpedantic -O2)
endif()

set(SOURCES
    src/protocol.cpp
    src/udp_socket.cpp
    src/connection.cpp
    src/congestion_control.cpp
    src/fec.cpp
    src/file_transfer.cpp
    src/statistics.cpp
)

set(HEADERS
    include/protocol.h
    include/udp_socket.h
    include/connection.h
    include/congestion_control.h
    include/fec.h
    include/file_transfer.h
    include/statistics.h
)

add_library(reliable_udp STATIC ${SOURCES} ${HEADERS})
target_include_directories(reliable_udp PUBLIC include)

if(WIN32)
    target_link_libraries(reliable_udp PUBLIC ws2_32)
endif()

add_executable(sender src/sender.cpp)
target_link_libraries(sender PRIVATE reliable_udp)

add_executable(receiver src/receiver.cpp)
target_link_libraries(receiver PRIVATE reliable_udp)
