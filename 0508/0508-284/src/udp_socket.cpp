#include "udp_socket.h"
#include <cstring>
#include <stdexcept>
#include <iostream>

NetworkAddress::NetworkAddress() : port(0) {}

NetworkAddress::NetworkAddress(const std::string& ip, uint16_t port) : ip(ip), port(port) {}

bool NetworkAddress::operator==(const NetworkAddress& other) const {
    return ip == other.ip && port == other.port;
}

bool NetworkAddress::operator!=(const NetworkAddress& other) const {
    return !(*this == other);
}

std::string NetworkAddress::to_string() const {
    return ip + ":" + std::to_string(port);
}

NetworkManager::NetworkManager() : initialized_(false) {}

NetworkManager::~NetworkManager() {
    shutdown();
}

bool NetworkManager::initialize() {
#ifdef _WIN32
    if (initialized_) return true;
    WSADATA wsaData;
    int result = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (result != 0) {
        return false;
    }
    initialized_ = true;
    return true;
#else
    initialized_ = true;
    return true;
#endif
}

void NetworkManager::shutdown() {
#ifdef _WIN32
    if (initialized_) {
        WSACleanup();
        initialized_ = false;
    }
#endif
}

UdpSocket::UdpSocket() : socket_fd_(INVALID_SOCKET_VAL) {}

UdpSocket::~UdpSocket() {
    close();
}

bool UdpSocket::init_socket() {
    if (socket_fd_ != INVALID_SOCKET_VAL) {
        return true;
    }
    
    socket_fd_ = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    return socket_fd_ != INVALID_SOCKET_VAL;
}

void UdpSocket::cleanup() {
    if (socket_fd_ != INVALID_SOCKET_VAL) {
#ifdef _WIN32
        closesocket(socket_fd_);
#else
        ::close(socket_fd_);
#endif
        socket_fd_ = INVALID_SOCKET_VAL;
    }
}

bool UdpSocket::bind(const NetworkAddress& addr) {
    if (!init_socket()) {
        return false;
    }
    
    sockaddr_in serv_addr;
    std::memset(&serv_addr, 0, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(addr.port);
    
    if (addr.ip.empty() || addr.ip == "0.0.0.0") {
        serv_addr.sin_addr.s_addr = INADDR_ANY;
    } else {
        if (inet_pton(AF_INET, addr.ip.c_str(), &serv_addr.sin_addr) <= 0) {
            return false;
        }
    }
    
    if (::bind(socket_fd_, reinterpret_cast<sockaddr*>(&serv_addr), sizeof(serv_addr)) == SOCKET_ERROR_VAL) {
        return false;
    }
    
    local_addr_ = addr;
    return true;
}

bool UdpSocket::bind_any(uint16_t port) {
    return bind(NetworkAddress("0.0.0.0", port));
}

void UdpSocket::close() {
    cleanup();
}

bool UdpSocket::send_to(const Packet& packet, const NetworkAddress& dest_addr) {
    if (!init_socket()) {
        return false;
    }
    
    std::vector<uint8_t> buffer(sizeof(PacketHeader) + MAX_PAYLOAD_SIZE);
    size_t packet_size = packet.serialize(buffer.data(), buffer.size());
    
    if (packet_size == 0) {
        return false;
    }
    
    sockaddr_in serv_addr;
    std::memset(&serv_addr, 0, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(dest_addr.port);
    
    if (inet_pton(AF_INET, dest_addr.ip.c_str(), &serv_addr.sin_addr) <= 0) {
        return false;
    }
    
    int sent = sendto(socket_fd_, reinterpret_cast<const char*>(buffer.data()), 
                      static_cast<int>(packet_size), 0, 
                      reinterpret_cast<sockaddr*>(&serv_addr), sizeof(serv_addr));
    
    return sent == static_cast<int>(packet_size);
}

bool UdpSocket::receive_from(Packet& packet, NetworkAddress& src_addr, int timeout_ms) {
    if (!init_socket()) {
        return false;
    }
    
#ifdef _WIN32
    fd_set read_fds;
    FD_ZERO(&read_fds);
    FD_SET(socket_fd_, &read_fds);
    
    timeval timeout;
    timeout.tv_sec = timeout_ms / 1000;
    timeout.tv_usec = (timeout_ms % 1000) * 1000;
    
    int result = select(0, &read_fds, nullptr, nullptr, &timeout);
    if (result <= 0 || !FD_ISSET(socket_fd_, &read_fds)) {
        return false;
    }
#else
    fd_set read_fds;
    FD_ZERO(&read_fds);
    FD_SET(socket_fd_, &read_fds);
    
    timeval timeout;
    timeout.tv_sec = timeout_ms / 1000;
    timeout.tv_usec = (timeout_ms % 1000) * 1000;
    
    int result = select(socket_fd_ + 1, &read_fds, nullptr, nullptr, &timeout);
    if (result <= 0 || !FD_ISSET(socket_fd_, &read_fds)) {
        return false;
    }
#endif
    
    std::vector<uint8_t> buffer(sizeof(PacketHeader) + MAX_PAYLOAD_SIZE);
    sockaddr_in client_addr;
    socklen_t client_len = sizeof(client_addr);
    
    int received = recvfrom(socket_fd_, reinterpret_cast<char*>(buffer.data()), 
                            static_cast<int>(buffer.size()), 0,
                            reinterpret_cast<sockaddr*>(&client_addr), &client_len);
    
    if (received <= 0) {
        return false;
    }
    
    if (!packet.deserialize(buffer.data(), static_cast<size_t>(received))) {
        return false;
    }
    
    char ip_str[INET_ADDRSTRLEN];
    inet_ntop(AF_INET, &client_addr.sin_addr, ip_str, INET_ADDRSTRLEN);
    src_addr.ip = ip_str;
    src_addr.port = ntohs(client_addr.sin_port);
    
    return true;
}

void UdpSocket::set_non_blocking(bool non_blocking) {
    if (socket_fd_ == INVALID_SOCKET_VAL) {
        return;
    }
    
#ifdef _WIN32
    u_long mode = non_blocking ? 1 : 0;
    ioctlsocket(socket_fd_, FIONBIO, &mode);
#else
    int flags = fcntl(socket_fd_, F_GETFL, 0);
    if (flags != -1) {
        if (non_blocking) {
            flags |= O_NONBLOCK;
        } else {
            flags &= ~O_NONBLOCK;
        }
        fcntl(socket_fd_, F_SETFL, flags);
    }
#endif
}

bool UdpSocket::is_valid() const {
    return socket_fd_ != INVALID_SOCKET_VAL;
}

NetworkAddress UdpSocket::get_local_address() const {
    return local_addr_;
}
