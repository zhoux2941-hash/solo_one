#pragma once

#include "protocol.h"
#include "udp_socket.h"
#include "congestion_control.h"
#include "statistics.h"
#include "fec.h"
#include "file_transfer.h"
#include <thread>
#include <atomic>
#include <queue>
#include <condition_variable>
#include <functional>

struct Stream {
    uint32_t stream_id;
    CubicCongestionControl congestion;
    FlowControl flow_control;
    std::shared_ptr<FileSender> sender;
    std::shared_ptr<FileReceiver> receiver;
    uint64_t next_sequence;
    uint64_t last_acked_sequence;
    std::map<uint64_t, RetransmissionInfo> retransmission_queue;
    std::set<uint64_t> received_sequences;
    uint64_t max_received_sequence;
    std::chrono::steady_clock::time_point last_activity;
    
    Stream(uint32_t id);
};

class Connection {
public:
    using DataCallback = std::function<void(uint32_t stream_id, const std::vector<uint8_t>& data)>;
    using StreamCallback = std::function<void(uint32_t stream_id)>;
    
    Connection();
    ~Connection();
    
    bool connect(const NetworkAddress& peer_addr);
    bool listen(uint16_t port);
    void close();
    
    bool send_data(uint32_t stream_id, const std::vector<uint8_t>& data);
    bool send_file(uint32_t stream_id, const std::string& filepath);
    bool receive_file(uint32_t stream_id, const std::string& filepath);
    
    void set_data_callback(DataCallback callback);
    void set_connect_callback(StreamCallback callback);
    void set_close_callback(StreamCallback callback);
    
    ConnectionState state() const { return state_.load(); }
    uint32_t connection_id() const { return conn_id_; }
    
    StatisticsManager& statistics() { return stats_; }
    const StatisticsManager& statistics() const { return stats_; }
    
    bool is_established() const { return state_ == ConnectionState::ESTABLISHED; }
    
    void run_event_loop();
    void stop_event_loop();
    
    std::vector<uint32_t> get_active_streams() const;
    float get_stream_progress(uint32_t stream_id) const;
    
    using AddressCallback = std::function<void(const NetworkAddress& old_addr, const NetworkAddress& new_addr)>;
    void set_migration_callback(AddressCallback callback);
    
    NetworkAddress get_peer_address() const;
    std::vector<NetworkAddress> get_all_peer_addresses() const;
    bool migrate_to_new_address(const NetworkAddress& new_addr);
    bool is_migration_in_progress() const;
    size_t get_active_path_count() const;
    
    bool add_connection_id(uint32_t new_cid, uint8_t sequence);
    void retire_connection_id(uint32_t cid);
    std::vector<uint32_t> get_active_connection_ids() const;
    
private:
    std::unique_ptr<UdpSocket> socket_;
    NetworkAddress peer_addr_;
    uint32_t conn_id_;
    std::atomic<ConnectionState> state_;
    
    uint64_t next_connection_seq_;
    uint32_t initial_peer_seq_;
    
    std::map<uint32_t, std::unique_ptr<Stream>> streams_;
    mutable std::mutex streams_mutex_;
    
    std::queue<Packet> send_queue_;
    mutable std::mutex send_mutex_;
    std::condition_variable send_cv_;
    
    std::thread event_loop_thread_;
    std::atomic<bool> running_;
    
    DataCallback data_callback_;
    StreamCallback connect_callback_;
    StreamCallback close_callback_;
    AddressCallback migration_callback_;
    
    StatisticsManager stats_;
    FecEncoder fec_encoder_;
    FecDecoder fec_decoder_;
    
    std::vector<ConnectionIdInfo> active_cids_;
    mutable std::mutex cids_mutex_;
    uint8_t next_cid_sequence_;
    
    std::map<std::string, PathInfo> peer_paths_;
    mutable std::mutex paths_mutex_;
    std::string preferred_path_key_;
    
    std::atomic<bool> migration_in_progress_;
    NetworkAddress pending_migration_addr_;
    
    void event_loop();
    void process_packet(const Packet& packet, const NetworkAddress& from);
    
    void handle_handshake_syn(const Packet& packet);
    void handle_handshake_syn_ack(const Packet& packet);
    void handle_handshake_ack(const Packet& packet);
    void handle_data_packet(const Packet& packet);
    void handle_ack_packet(const Packet& packet);
    void handle_nack_packet(const Packet& packet);
    void handle_fec_packet(const Packet& packet);
    void handle_file_info(const Packet& packet);
    void handle_fin(const Packet& packet);
    
    void handle_path_challenge(const Packet& packet, const NetworkAddress& from);
    void handle_path_response(const Packet& packet, const NetworkAddress& from);
    void handle_new_connection_id(const Packet& packet);
    void handle_retire_connection_id(const Packet& packet);
    void handle_address_update(const Packet& packet);
    
    bool send_packet(const Packet& packet);
    bool send_packet_to(const Packet& packet, const NetworkAddress& dest_addr);
    void queue_packet(const Packet& packet);
    
    void process_retransmissions();
    void check_timeouts();
    void check_path_timeouts();
    
    Stream* get_or_create_stream(uint32_t stream_id);
    Stream* get_stream(uint32_t stream_id);
    const Stream* get_stream(uint32_t stream_id) const;
    
    void send_ack(uint32_t stream_id, uint64_t ack_seq);
    void send_nack(uint32_t stream_id, const std::vector<uint64_t>& missing);
    void send_file_info(uint32_t stream_id, const std::string& filename, uint64_t file_size);
    
    void send_path_challenge(const NetworkAddress& to_addr);
    void send_path_response(const NetworkAddress& to_addr, const uint64_t data[2]);
    void send_address_update(const NetworkAddress& new_addr);
    void send_new_connection_id(uint32_t new_cid, uint8_t sequence);
    
    bool process_file_data(uint32_t stream_id);
    
    void handle_duplicate_packet(const Packet& packet);
    void handle_out_of_order_packet(const Packet& packet);
    
    bool verify_connection_id(uint32_t cid) const;
    PathInfo* get_or_create_path(const NetworkAddress& addr);
    void update_preferred_path();
    bool validate_new_path(const NetworkAddress& addr);
    
    std::string addr_to_key(const NetworkAddress& addr) const;
    NetworkAddress addr_from_key(const std::string& key) const;
    
    void generate_challenge_data(uint64_t data[2]);
    bool verify_challenge_data(const uint64_t received[2], const uint64_t expected[2]) const;
    
    static constexpr uint64_t ACK_DELAY_MS = 20;
    static constexpr uint64_t RETRANSMIT_TIMEOUT_BASE_US = 20000;
    static constexpr uint64_t RETRANSMIT_TIMEOUT_MIN_US = 5000;
    static constexpr uint64_t RETRANSMIT_TIMEOUT_MAX_US = 500000;
    static constexpr size_t MAX_RETRANSMIT_COUNT = 15;
};
