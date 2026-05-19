#pragma once

#include "protocol.h"
#include <string>
#include <cstdint>
#include <vector>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
using SOCKET_TYPE = SOCKET;
constexpr SOCKET_TYPE INVALID_SOCKET_VAL = INVALID_SOCKET;
constexpr int SOCKET_ERROR_VAL = SOCKET_ERROR;
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <fcntl.h>
using SOCKET_TYPE = int;
constexpr SOCKET_TYPE INVALID_SOCKET_VAL = -1;
constexpr int SOCKET_ERROR_VAL = -1;
#endif

struct NetworkAddress {
    std::string ip;
    uint16_t port;
    
    NetworkAddress();
    NetworkAddress(const std::string& ip, uint16_t port);
    
    bool operator==(const NetworkAddress& other) const;
    bool operator!=(const NetworkAddress& other) const;
    std::string to_string() const;
};

class UdpSocket {
public:
    UdpSocket();
    ~UdpSocket();
    
    bool bind(const NetworkAddress& addr);
    bool bind_any(uint16_t port);
    void close();
    
    bool send_to(const Packet& packet, const NetworkAddress& dest_addr);
    bool receive_from(Packet& packet, NetworkAddress& src_addr, int timeout_ms = 100);
    
    void set_non_blocking(bool non_blocking);
    bool is_valid() const;
    
    NetworkAddress get_local_address() const;
    
private:
    SOCKET_TYPE socket_fd_;
    NetworkAddress local_addr_;
    
    bool init_socket();
    void cleanup();
};

class NetworkManager {
public:
    NetworkManager();
    ~NetworkManager();
    
    bool initialize();
    void shutdown();
    
private:
    bool initialized_;
};
