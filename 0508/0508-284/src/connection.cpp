#include "connection.h"
#include <iostream>
#include <algorithm>
#include <cstring>
#include <random>

Stream::Stream(uint32_t id)
    : stream_id(id), next_sequence(0), last_acked_sequence(0),
    max_received_sequence(0) {
    last_activity = std::chrono::steady_clock::now();
}

Connection::Connection()
    : conn_id_(0), state_(ConnectionState::CLOSED),
      next_connection_seq_(0), initial_peer_seq_(0),
      running_(false), next_cid_sequence_(0),
      migration_in_progress_(false) {}

Connection::~Connection() {
    close();
}

bool Connection::connect(const NetworkAddress& peer_addr) {
    peer_addr_ = peer_addr;
    conn_id_ = generate_connection_id();
    socket_ = std::make_unique<UdpSocket>();
    
    if (!socket_->bind_any(0)) {
        return false;
    }
    
    {
        std::lock_guard<std::mutex> lock(cids_mutex_);
        ConnectionIdInfo cid_info;
        cid_info.connection_id = conn_id_;
        cid_info.sequence_number = next_cid_sequence_++;
        cid_info.is_active = true;
        cid_info.created_time = std::chrono::steady_clock::now();
        active_cids_.push_back(cid_info);
    }
    
    {
        std::lock_guard<std::mutex> lock(paths_mutex_);
        PathInfo path;
        path.address = peer_addr;
        path.status = PathStatus::VALIDATED;
        path.last_active_time = std::chrono::steady_clock::now();
        path.rtt_us = 100000;
        path.challenge_attempts = 0;
        path.is_preferred = true;
        preferred_path_key_ = addr_to_key(peer_addr);
        peer_paths_[preferred_path_key_] = path;
    }
    
    state_ = ConnectionState::SYN_SENT;
    
    Packet syn_pkt(PacketType::HANDSHAKE_SYN, conn_id_, 0, next_connection_seq_++);
    
    HandshakeSyn syn;
    syn.initial_sequence = static_cast<uint32_t>(next_connection_seq_);
    syn.max_stream_count = 100;
    syn.recv_window_size = 65536 * 32;
    
    syn_pkt.payload.resize(sizeof(HandshakeSyn));
    std::memcpy(syn_pkt.payload.data(), &syn, sizeof(HandshakeSyn));
    
    send_packet(syn_pkt);
    
    running_ = true;
    event_loop_thread_ = std::thread(&Connection::event_loop, this);
    
    int timeout = 0;
    while (state_ == ConnectionState::SYN_SENT && timeout < 5000) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
        timeout += 100;
    }
    
    return state_ == ConnectionState::ESTABLISHED;
}

bool Connection::listen(uint16_t port) {
    conn_id_ = generate_connection_id();
    socket_ = std::make_unique<UdpSocket>();
    
    if (!socket_->bind(NetworkAddress("0.0.0.0", port))) {
        return false;
    }
    
    {
        std::lock_guard<std::mutex> lock(cids_mutex_);
        ConnectionIdInfo cid_info;
        cid_info.connection_id = conn_id_;
        cid_info.sequence_number = next_cid_sequence_++;
        cid_info.is_active = true;
        cid_info.created_time = std::chrono::steady_clock::now();
        active_cids_.push_back(cid_info);
    }
    
    state_ = ConnectionState::LISTENING;
    
    running_ = true;
    event_loop_thread_ = std::thread(&Connection::event_loop, this);
    
    return true;
}

void Connection::close() {
    running_ = false;
    
    if (event_loop_thread_.joinable()) {
        event_loop_thread_.join();
    }
    
    if (socket_) {
        socket_->close();
    }
    
    state_ = ConnectionState::CLOSED;
}

bool Connection::send_data(uint32_t stream_id, const std::vector<uint8_t>& data) {
    if (state_ != ConnectionState::ESTABLISHED) {
        return false;
    }
    
    Stream* stream = get_or_create_stream(stream_id);
    if (!stream) {
        return false;
    }
    
    size_t offset = 0;
    while (offset < data.size()) {
        size_t chunk_size = std::min(MAX_PAYLOAD_SIZE, data.size() - offset);
        
        Packet pkt(PacketType::DATA, conn_id_, stream_id, stream->next_sequence++);
        pkt.payload.assign(data.begin() + offset, data.begin() + offset + chunk_size);
        
        queue_packet(pkt);
        offset += chunk_size;
    }
    
    return true;
}

bool Connection::send_file(uint32_t stream_id, const std::string& filepath) {
    if (state_ != ConnectionState::ESTABLISHED) {
        return false;
    }
    
    Stream* stream = get_or_create_stream(stream_id);
    if (!stream) {
        return false;
    }
    
    auto sender = std::make_shared<FileSender>();
    if (!sender->open_file(filepath, stream_id)) {
        return false;
    }
    
    stream->sender = sender;
    
    send_file_info(stream_id, sender->filename(), sender->file_size());
    
    return true;
}

bool Connection::receive_file(uint32_t stream_id, const std::string& filepath) {
    Stream* stream = get_or_create_stream(stream_id);
    if (!stream) {
        return false;
    }
    
    stream->receiver = std::make_shared<FileReceiver>();
    return true;
}

void Connection::set_data_callback(DataCallback callback) {
    data_callback_ = callback;
}

void Connection::set_connect_callback(StreamCallback callback) {
    connect_callback_ = callback;
}

void Connection::set_close_callback(StreamCallback callback) {
    close_callback_ = callback;
}

void Connection::run_event_loop() {
    if (!running_) {
        running_ = true;
        event_loop_thread_ = std::thread(&Connection::event_loop, this);
    }
}

void Connection::stop_event_loop() {
    running_ = false;
}

void Connection::event_loop() {
    auto last_retransmit_check = std::chrono::steady_clock::now();
    
    while (running_) {
        Packet packet;
        NetworkAddress from_addr;
        
        if (socket_->receive_from(packet, from_addr, 2)) {
            process_packet(packet, from_addr);
        }
        
        auto now = std::chrono::steady_clock::now();
        
        if (now - last_retransmit_check >= std::chrono::milliseconds(10)) {
            process_retransmissions();
            check_timeouts();
            last_retransmit_check = now;
        }
        
        if (state_ == ConnectionState::ESTABLISHED) {
            std::lock_guard<std::mutex> lock(streams_mutex_);
            for (auto& pair : streams_) {
                auto& stream = pair.second;
                if (stream->sender && !stream->sender->is_complete()) {
                    int packets_sent = 0;
                    const int max_burst = 64;
                    
                    while (packets_sent < max_burst) {
                        std::vector<uint8_t> data;
                        uint64_t chunk_index;
                        
                        if (!stream->sender->get_next_chunk(data, chunk_index)) {
                            break;
                        }
                        
                        if (!stream->congestion.can_send(data.size())) {
                            break;
                        }
                        
                        Packet pkt(PacketType::DATA, conn_id_, stream->stream_id,
                                    stream->next_sequence++);
                        
                        pkt.payload.resize(sizeof(uint64_t) + data.size());
                        *reinterpret_cast<uint64_t*>(pkt.payload.data()) = chunk_index;
                        std::memcpy(pkt.payload.data() + sizeof(uint64_t),
                                    data.data(), data.size());
                        
                        RetransmissionInfo retrans;
                        retrans.packet = pkt;
                        retrans.send_time = std::chrono::steady_clock::now();
                        retrans.retransmit_count = 0;
                        stream->retransmission_queue[pkt.header.sequence_number] = retrans;
                        
                        send_packet(pkt);
                        stream->congestion.increase_bytes_in_flight(data.size());
                        stats_.transfer_stats().record_packet_sent(pkt.payload.size());
                        
                        packets_sent++;
                    }
                }
            }
        }
        
        std::unique_lock<std::mutex> send_lock(send_mutex_);
        while (!send_queue_.empty()) {
            Packet pkt = send_queue_.front();
            send_queue_.pop();
            send_lock.unlock();
            
            send_packet(pkt);
            
            send_lock.lock();
        }
    }
}

void Connection::process_packet(const Packet& packet, const NetworkAddress& from) {
    if (state_ == ConnectionState::LISTENING) {
        if (packet.header.type == PacketType::HANDSHAKE_SYN) {
            peer_addr_ = from;
            handle_handshake_syn(packet);
        }
        return;
    }
    
    if (from != peer_addr_) {
        return;
    }
    
    stats_.transfer_stats().record_packet_received(packet.payload.size());
    
    switch (packet.header.type) {
        case PacketType::HANDSHAKE_SYN:
            handle_handshake_syn(packet);
            break;
        case PacketType::HANDSHAKE_SYN_ACK:
            handle_handshake_syn_ack(packet);
            break;
        case PacketType::HANDSHAKE_ACK:
            handle_handshake_ack(packet);
            break;
        case PacketType::DATA:
            handle_data_packet(packet);
            break;
        case PacketType::ACK:
            handle_ack_packet(packet);
            break;
        case PacketType::NACK:
            handle_nack_packet(packet);
            break;
        case PacketType::FEC_REDUNDANT:
            handle_fec_packet(packet);
            break;
        case PacketType::FILE_INFO:
            handle_file_info(packet);
            break;
        case PacketType::FIN:
            handle_fin(packet);
            break;
        default:
            break;
    }
}

void Connection::handle_handshake_syn(const Packet& packet) {
    if (state_ == ConnectionState::LISTENING) {
        state_ = ConnectionState::SYN_RECEIVED;
        
        HandshakeSyn syn;
        if (packet.payload.size() >= sizeof(HandshakeSyn)) {
            std::memcpy(&syn, packet.payload.data(), sizeof(HandshakeSyn));
            initial_peer_seq_ = syn.initial_sequence;
        }
        
        Packet syn_ack(PacketType::HANDSHAKE_SYN_ACK, conn_id_, 0, next_connection_seq_++);
        
        HandshakeSynAck syn_ack_data;
        syn_ack_data.initial_sequence = static_cast<uint32_t>(next_connection_seq_);
        syn_ack_data.peer_initial_sequence = initial_peer_seq_;
        syn_ack_data.max_stream_count = 100;
        syn_ack_data.recv_window_size = 65536 * 32;
        
        syn_ack.payload.resize(sizeof(HandshakeSynAck));
        std::memcpy(syn_ack.payload.data(), &syn_ack_data, sizeof(HandshakeSynAck));
        
        send_packet(syn_ack);
    }
}

void Connection::handle_handshake_syn_ack(const Packet& packet) {
    if (state_ == ConnectionState::SYN_SENT) {
        HandshakeSynAck syn_ack;
        if (packet.payload.size() >= sizeof(HandshakeSynAck)) {
            std::memcpy(&syn_ack, packet.payload.data(), sizeof(HandshakeSynAck));
            initial_peer_seq_ = syn_ack.initial_sequence;
        }
        
        Packet ack(PacketType::HANDSHAKE_ACK, conn_id_, 0, next_connection_seq_++);
        
        HandshakeAck ack_data;
        ack_data.peer_initial_sequence = initial_peer_seq_;
        
        ack.payload.resize(sizeof(HandshakeAck));
        std::memcpy(ack.payload.data(), &ack_data, sizeof(HandshakeAck));
        
        send_packet(ack);
        
        state_ = ConnectionState::ESTABLISHED;
        
        if (connect_callback_) {
            connect_callback_(0);
        }
    }
}

void Connection::handle_handshake_ack(const Packet& packet) {
    if (state_ == ConnectionState::SYN_RECEIVED) {
        state_ = ConnectionState::ESTABLISHED;
        
        if (connect_callback_) {
            connect_callback_(0);
        }
    }
}

void Connection::handle_data_packet(const Packet& packet) {
    uint32_t stream_id = packet.header.stream_id;
    Stream* stream = get_or_create_stream(stream_id);
    if (!stream) {
        return;
    }
    
    uint64_t seq = packet.header.sequence_number;
    
    if (stream->received_sequences.find(seq) != stream->received_sequences.end()) {
        handle_duplicate_packet(packet);
        return;
    }
    
    if (seq <= stream->max_received_sequence) {
        handle_out_of_order_packet(packet);
    }
    
    stream->received_sequences.insert(seq);
    stream->max_received_sequence = std::max(stream->max_received_sequence, seq);
    stream->last_activity = std::chrono::steady_clock::now();
    
    if (packet.payload.size() >= sizeof(uint64_t)) {
        uint64_t chunk_index = *reinterpret_cast<const uint64_t*>(packet.payload.data());
        
        if (stream->receiver) {
            std::vector<uint8_t> data(
                packet.payload.begin() + sizeof(uint64_t),
                packet.payload.end()
            );
            stream->receiver->write_chunk(chunk_index, data);
        } else if (data_callback_) {
            data_callback_(stream_id, data);
        }
    }
    
    send_ack(stream_id, stream->max_received_sequence);
}

void Connection::handle_ack_packet(const Packet& packet) {
    if (packet.payload.size() < sizeof(AckPacket)) {
        return;
    }
    
    uint32_t stream_id = packet.header.stream_id;
    Stream* stream = get_stream(stream_id);
    if (!stream) {
        return;
    }
    
    AckPacket ack;
    std::memcpy(&ack, packet.payload.data(), sizeof(AckPacket));
    
    uint64_t now_us = std::chrono::duration_cast<std::chrono::microseconds>(
        std::chrono::steady_clock::now().time_since_epoch()
    ).count();
    uint64_t rtt_us = now_us - packet.header.timestamp * 1000;
    
    if (rtt_us < 1000000) {
        stats_.rtt_stats().update_rtt(static_cast<uint64_t>(rtt_us / 1000));
    }
    
    uint64_t total_bytes_acked = 0;
    for (uint64_t seq = stream->last_acked_sequence + 1; seq <= ack.ack_sequence; ++seq) {
        auto it = stream->retransmission_queue.find(seq);
        if (it != stream->retransmission_queue.end()) {
            size_t bytes_acked = it->second.packet.payload.size();
            total_bytes_acked += bytes_acked;
            
            if (stream->sender) {
                uint64_t chunk_index = *reinterpret_cast<uint64_t*>(it->second.packet.payload.data());
                stream->sender->mark_chunk_acked(chunk_index);
            }
            
            stream->retransmission_queue.erase(it);
        }
    }
    
    if (total_bytes_acked > 0) {
        stream->congestion.on_ack(total_bytes_acked, rtt_us);
    }
    
    stream->last_acked_sequence = ack.ack_sequence;
}

void Connection::handle_nack_packet(const Packet& packet) {
    if (packet.payload.size() < sizeof(NackPacket)) {
        return;
    }
    
    uint32_t stream_id = packet.header.stream_id;
    Stream* stream = get_stream(stream_id);
    if (!stream) {
        return;
    }
    
    NackPacket nack;
    std::memcpy(&nack, packet.payload.data(), sizeof(NackPacket));
    
    size_t offset = sizeof(NackPacket);
    for (uint16_t i = 0; i < nack.missing_count && offset + sizeof(uint64_t) <= packet.payload.size(); ++i) {
        uint64_t missing_seq = *reinterpret_cast<const uint64_t*>(packet.payload.data() + offset);
        
        auto it = stream->retransmission_queue.find(missing_seq);
        if (it != stream->retransmission_queue.end()) {
            send_packet(it->second.packet);
            it->second.retransmit_count++;
            it->second.send_time = std::chrono::steady_clock::now();
            
            stats_.transfer_stats().record_retransmission();
            stream->congestion.on_loss();
        }
        
        offset += sizeof(uint64_t);
    }
}

void Connection::handle_fec_packet(const Packet& packet) {
    if (packet.payload.size() < sizeof(uint64_t) * 2) {
        return;
    }
    
    uint64_t group_id = *reinterpret_cast<const uint64_t*>(packet.payload.data());
    uint64_t index = *reinterpret_cast<const uint64_t*>(packet.payload.data() + sizeof(uint64_t));
    
    fec_decoder_.add_redundant_packet(packet, group_id, static_cast<size_t>(index));
    
    std::vector<Packet> recovered;
    if (fec_decoder_.try_recover(group_id, recovered)) {
        for (const auto& recovered_pkt : recovered) {
            handle_data_packet(recovered_pkt);
            stats_.transfer_stats().record_fec_recovery();
        }
    }
}

void Connection::handle_file_info(const Packet& packet) {
    if (packet.payload.size() < sizeof(FileInfoPacket)) {
        return;
    }
    
    uint32_t stream_id = packet.header.stream_id;
    Stream* stream = get_or_create_stream(stream_id);
    if (!stream) {
        return;
    }
    
    FileInfoPacket file_info;
    std::memcpy(&file_info, packet.payload.data(), sizeof(FileInfoPacket));
    
    size_t filename_offset = sizeof(FileInfoPacket);
    std::string filename(
        packet.payload.begin() + filename_offset,
        packet.payload.begin() + filename_offset + file_info.filename_length
    );
    
    if (data_callback_) {
        data_callback_(stream_id, packet.payload);
    }
}

void Connection::handle_fin(const Packet& packet) {
    uint32_t stream_id = packet.header.stream_id;
    
    std::lock_guard<std::mutex> lock(streams_mutex_);
    auto it = streams_.find(stream_id);
    if (it != streams_.end()) {
        if (it->second->receiver) {
            it->second->receiver->close();
        }
        streams_.erase(it);
    }
}

bool Connection::send_packet(const Packet& packet) {
    return socket_->send_to(packet, peer_addr_);
}

void Connection::queue_packet(const Packet& packet) {
    std::lock_guard<std::mutex> lock(send_mutex_);
    send_queue_.push(packet);
}

void Connection::process_retransmissions() {
    std::lock_guard<std::mutex> lock(streams_mutex_);
    auto now = std::chrono::steady_clock::now();
    
    uint64_t smoothed_rtt_ms = stats_.rtt_stats().smoothed_rtt.load();
    uint64_t rtt_var_ms = stats_.rtt_stats().rtt_var.load();
    
    uint64_t rto_us;
    if (smoothed_rtt_ms > 0) {
        rto_us = (smoothed_rtt_ms + 4 * rtt_var_ms) * 1000;
        rto_us = std::max(rto_us, RETRANSMIT_TIMEOUT_MIN_US);
        rto_us = std::min(rto_us, RETRANSMIT_TIMEOUT_MAX_US);
    } else {
        rto_us = RETRANSMIT_TIMEOUT_BASE_US;
    }
    
    for (auto& pair : streams_) {
        auto& stream = pair.second;
        
        for (auto it = stream->retransmission_queue.begin();
             it != stream->retransmission_queue.end(); ) {
            
            auto elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(
                now - it->second.send_time
            ).count();
            
            if (static_cast<uint64_t>(elapsed_us) > rto_us) {
                if (it->second.retransmit_count < MAX_RETRANSMIT_COUNT) {
                    send_packet(it->second.packet);
                    it->second.retransmit_count++;
                    it->second.send_time = now;
                    stats_.transfer_stats().record_retransmission();
                    stream->congestion.on_loss();
                    ++it;
                } else {
                    stream->congestion.on_timeout();
                    it = stream->retransmission_queue.erase(it);
                }
            } else {
                ++it;
            }
        }
    }
}

void Connection::check_timeouts() {
}

Stream* Connection::get_or_create_stream(uint32_t stream_id) {
    std::lock_guard<std::mutex> lock(streams_mutex_);
    
    auto it = streams_.find(stream_id);
    if (it != streams_.end()) {
        return it->second.get();
    }
    
    auto stream = std::make_unique<Stream>(stream_id);
    Stream* result = stream.get();
    streams_[stream_id] = std::move(stream);
    return result;
}

Stream* Connection::get_stream(uint32_t stream_id) {
    std::lock_guard<std::mutex> lock(streams_mutex_);
    
    auto it = streams_.find(stream_id);
    if (it != streams_.end()) {
        return it->second.get();
    }
    return nullptr;
}

const Stream* Connection::get_stream(uint32_t stream_id) const {
    std::lock_guard<std::mutex> lock(streams_mutex_);
    
    auto it = streams_.find(stream_id);
    if (it != streams_.end()) {
        return it->second.get();
    }
    return nullptr;
}

void Connection::send_ack(uint32_t stream_id, uint64_t ack_seq) {
    Packet pkt(PacketType::ACK, conn_id_, stream_id, next_connection_seq_++);
    
    AckPacket ack;
    ack.ack_sequence = ack_seq;
    ack.ack_delay = 0;
    ack.ack_block_count = 0;
    
    pkt.payload.resize(sizeof(AckPacket));
    std::memcpy(pkt.payload.data(), &ack, sizeof(AckPacket));
    
    send_packet(pkt);
}

void Connection::send_nack(uint32_t stream_id, const std::vector<uint64_t>& missing) {
    Packet pkt(PacketType::NACK, conn_id_, stream_id, next_connection_seq_++);
    
    NackPacket nack;
    nack.missing_count = static_cast<uint16_t>(missing.size());
    
    pkt.payload.resize(sizeof(NackPacket) + missing.size() * sizeof(uint64_t));
    std::memcpy(pkt.payload.data(), &nack, sizeof(NackPacket));
    
    size_t offset = sizeof(NackPacket);
    for (uint64_t seq : missing) {
        std::memcpy(pkt.payload.data() + offset, &seq, sizeof(uint64_t));
        offset += sizeof(uint64_t);
    }
    
    send_packet(pkt);
}

void Connection::send_file_info(uint32_t stream_id, const std::string& filename, uint64_t file_size) {
    Packet pkt(PacketType::FILE_INFO, conn_id_, stream_id, next_connection_seq_++);
    
    FileInfoPacket file_info;
    file_info.file_size = file_size;
    file_info.chunk_count = (file_size + MAX_PAYLOAD_SIZE + 1) / MAX_PAYLOAD_SIZE;
    file_info.filename_length = static_cast<uint32_t>(filename.size());
    
    pkt.payload.resize(sizeof(FileInfoPacket) + filename.size());
    std::memcpy(pkt.payload.data(), &file_info, sizeof(FileInfoPacket));
    std::memcpy(pkt.payload.data() + sizeof(FileInfoPacket), filename.data(), filename.size());
    
    send_packet(pkt);
}

std::vector<uint32_t> Connection::get_active_streams() const {
    std::lock_guard<std::mutex> lock(streams_mutex_);
    
    std::vector<uint32_t> result;
    for (const auto& pair : streams_) {
        result.push_back(pair.first);
    }
    return result;
}

float Connection::get_stream_progress(uint32_t stream_id) const {
    const Stream* stream = get_stream(stream_id);
    if (!stream) {
        return 0.0f;
    }
    
    if (stream->sender) {
        return stream->sender->get_progress();
    }
    if (stream->receiver) {
        return stream->receiver->get_progress();
    }
    
    return 0.0f;
}

void Connection::handle_duplicate_packet(const Packet&) {
    stats_.transfer_stats().record_duplicate();
}

void Connection::handle_out_of_order_packet(const Packet&) {
}

void Connection::set_migration_callback(AddressCallback callback) {
    migration_callback_ = callback;
}

NetworkAddress Connection::get_peer_address() const {
    std::lock_guard<std::mutex> lock(paths_mutex_);
    if (preferred_path_key_.empty()) {
        return peer_addr_;
    }
    auto it = peer_paths_.find(preferred_path_key_);
    if (it != peer_paths_.end()) {
        return it->second.address;
    }
    return peer_addr_;
}

std::vector<NetworkAddress> Connection::get_all_peer_addresses() const {
    std::lock_guard<std::mutex> lock(paths_mutex_);
    std::vector<NetworkAddress> result;
    for (const auto& pair : peer_paths_) {
        result.push_back(pair.second.address);
    }
    return result;
}

bool Connection::migrate_to_new_address(const NetworkAddress& new_addr) {
    if (state_ != ConnectionState::ESTABLISHED) {
        return false;
    }
    
    {
        std::lock_guard<std::mutex> lock(paths_mutex_);
        PathInfo* path = get_or_create_path(new_addr);
        if (!path) {
            return false;
        }
        
        if (path->status == PathStatus::VALIDATED) {
            preferred_path_key_ = addr_to_key(new_addr);
            peer_addr_ = new_addr;
            return true;
        }
        
        migration_in_progress_ = true;
        pending_migration_addr_ = new_addr;
    }
    
    send_path_challenge(new_addr);
    return true;
}

bool Connection::is_migration_in_progress() const {
    return migration_in_progress_.load();
}

size_t Connection::get_active_path_count() const {
    std::lock_guard<std::mutex> lock(paths_mutex_);
    size_t count = 0;
    for (const auto& pair : peer_paths_) {
        if (pair.second.status == PathStatus::VALIDATED) {
            count++;
        }
    }
    return count;
}

bool Connection::add_connection_id(uint32_t new_cid, uint8_t sequence) {
    std::lock_guard<std::mutex> lock(cids_mutex_);
    
    if (active_cids_.size() >= MAX_ACTIVE_CIDS) {
        return false;
    }
    
    for (const auto& cid : active_cids_) {
        if (cid.connection_id == new_cid) {
            return false;
        }
    }
    
    ConnectionIdInfo cid_info;
    cid_info.connection_id = new_cid;
    cid_info.sequence_number = sequence;
    cid_info.is_active = true;
    cid_info.created_time = std::chrono::steady_clock::now();
    active_cids_.push_back(cid_info);
    
    return true;
}

void Connection::retire_connection_id(uint32_t cid) {
    std::lock_guard<std::mutex> lock(cids_mutex_);
    
    for (auto it = active_cids_.begin(); it != active_cids_.end(); ++it) {
        if (it->connection_id == cid) {
            it->is_active = false;
            break;
        }
    }
}

std::vector<uint32_t> Connection::get_active_connection_ids() const {
    std::lock_guard<std::mutex> lock(cids_mutex_);
    
    std::vector<uint32_t> result;
    for (const auto& cid : active_cids_) {
        if (cid.is_active) {
            result.push_back(cid.connection_id);
        }
    }
    return result;
}

void Connection::process_packet(const Packet& packet, const NetworkAddress& from) {
    if (state_ == ConnectionState::LISTENING) {
        if (packet.header.type == PacketType::HANDSHAKE_SYN) {
            peer_addr_ = from;
            
            std::lock_guard<std::mutex> lock(paths_mutex_);
            PathInfo path;
            path.address = from;
            path.status = PathStatus::VALIDATED;
            path.last_active_time = std::chrono::steady_clock::now();
            path.rtt_us = 100000;
            path.challenge_attempts = 0;
            path.is_preferred = true;
            preferred_path_key_ = addr_to_key(from);
            peer_paths_[preferred_path_key_] = path;
            
            handle_handshake_syn(packet);
        }
        return;
    }
    
    if (!verify_connection_id(packet.header.connection_id)) {
        return;
    }
    
    {
        std::lock_guard<std::mutex> lock(paths_mutex_);
        PathInfo* path = get_or_create_path(from);
        if (path) {
            path->last_active_time = std::chrono::steady_clock::now();
        }
    }
    
    stats_.transfer_stats().record_packet_received(packet.payload.size());
    
    switch (packet.header.type) {
        case PacketType::HANDSHAKE_SYN:
            handle_handshake_syn(packet);
            break;
        case PacketType::HANDSHAKE_SYN_ACK:
            handle_handshake_syn_ack(packet);
            break;
        case PacketType::HANDSHAKE_ACK:
            handle_handshake_ack(packet);
            break;
        case PacketType::DATA:
            handle_data_packet(packet);
            break;
        case PacketType::ACK:
            handle_ack_packet(packet);
            break;
        case PacketType::NACK:
            handle_nack_packet(packet);
            break;
        case PacketType::FEC_REDUNDANT:
            handle_fec_packet(packet);
            break;
        case PacketType::FILE_INFO:
            handle_file_info(packet);
            break;
        case PacketType::FIN:
            handle_fin(packet);
            break;
        case PacketType::PATH_CHALLENGE:
            handle_path_challenge(packet, from);
            break;
        case PacketType::PATH_RESPONSE:
            handle_path_response(packet, from);
            break;
        case PacketType::NEW_CONNECTION_ID:
            handle_new_connection_id(packet);
            break;
        case PacketType::RETIRE_CONNECTION_ID:
            handle_retire_connection_id(packet);
            break;
        case PacketType::ADDRESS_UPDATE:
            handle_address_update(packet);
            break;
        default:
            break;
    }
}

void Connection::handle_path_challenge(const Packet& packet, const NetworkAddress& from) {
    if (packet.payload.size() < sizeof(PathChallenge)) {
        return;
    }
    
    PathChallenge challenge;
    std::memcpy(&challenge, packet.payload.data(), sizeof(PathChallenge));
    
    send_path_response(from, challenge.challenge_data);
}

void Connection::handle_path_response(const Packet& packet, const NetworkAddress& from) {
    if (packet.payload.size() < sizeof(PathResponse)) {
        return;
    }
    
    PathResponse response;
    std::memcpy(&response, packet.payload.data(), sizeof(PathResponse));
    
    std::lock_guard<std::mutex> lock(paths_mutex_);
    std::string key = addr_to_key(from);
    auto it = peer_paths_.find(key);
    if (it == peer_paths_.end()) {
        return;
    }
    
    if (verify_challenge_data(response.response_data, it->second.challenge_data)) {
        NetworkAddress old_addr = peer_addr_;
        it->second.status = PathStatus::VALIDATED;
        it->second.challenge_attempts = 0;
        
        auto now = std::chrono::steady_clock::now();
        auto elapsed = std::chrono::duration_cast<std::chrono::microseconds>(
            now - it->second.last_challenge_time
        ).count();
        it->second.rtt_us = static_cast<uint64_t>(elapsed);
        
        if (migration_in_progress_ && from == pending_migration_addr_) {
            preferred_path_key_ = key;
            it->second.is_preferred = true;
            peer_addr_ = from;
            migration_in_progress_ = false;
            
            if (migration_callback_) {
                migration_callback_(old_addr, from);
            }
        } else if (migration_in_progress_) {
            migration_in_progress_ = false;
        }
    }
}

void Connection::handle_new_connection_id(const Packet& packet) {
    if (packet.payload.size() < sizeof(NewConnectionId)) {
        return;
    }
    
    NewConnectionId new_cid;
    std::memcpy(&new_cid, packet.payload.data(), sizeof(NewConnectionId));
    
    add_connection_id(new_cid.new_connection_id, new_cid.sequence_number);
    
    if (new_cid.retire_prior_to > 0) {
        std::lock_guard<std::mutex> lock(cids_mutex_);
        for (auto& cid : active_cids_) {
            if (cid.sequence_number < new_cid.retire_prior_to) {
                cid.is_active = false;
            }
        }
    }
}

void Connection::handle_retire_connection_id(const Packet& packet) {
    if (packet.payload.size() < sizeof(RetireConnectionId)) {
        return;
    }
    
    RetireConnectionId retire;
    std::memcpy(&retire, packet.payload.data(), sizeof(RetireConnectionId));
    
    retire_connection_id(retire.connection_id);
}

void Connection::handle_address_update(const Packet& packet) {
    if (packet.payload.size() < sizeof(AddressUpdate)) {
        return;
    }
    
    AddressUpdate addr_update;
    std::memcpy(&addr_update, packet.payload.data(), sizeof(AddressUpdate));
    
    NetworkAddress new_addr;
    if (addr_update.ip_type == IPV4) {
        char ip_str[INET_ADDRSTRLEN];
        inet_ntop(AF_INET, addr_update.ip_bytes, ip_str, INET_ADDRSTRLEN);
        new_addr.ip = ip_str;
        new_addr.port = ntohs(addr_update.port);
    } else if (addr_update.ip_type == IPV6) {
        char ip_str[INET6_ADDRSTRLEN];
        inet_ntop(AF_INET6, addr_update.ip_bytes, ip_str, INET6_ADDRSTRLEN);
        new_addr.ip = ip_str;
        new_addr.port = ntohs(addr_update.port);
    }
    
    if (!new_addr.ip.empty()) {
        migrate_to_new_address(new_addr);
    }
}

bool Connection::send_packet(const Packet& packet) {
    std::lock_guard<std::mutex> lock(paths_mutex_);
    
    if (preferred_path_key_.empty()) {
        return socket_->send_to(packet, peer_addr_);
    }
    
    auto it = peer_paths_.find(preferred_path_key_);
    if (it != peer_paths_.end()) {
        return socket_->send_to(packet, it->second.address);
    }
    
    return socket_->send_to(packet, peer_addr_);
}

bool Connection::send_packet_to(const Packet& packet, const NetworkAddress& dest_addr) {
    return socket_->send_to(packet, dest_addr);
}

void Connection::send_path_challenge(const NetworkAddress& to_addr) {
    Packet pkt(PacketType::PATH_CHALLENGE, conn_id_, 0, next_connection_seq_++);
    
    PathChallenge challenge;
    generate_challenge_data(challenge.challenge_data);
    
    pkt.payload.resize(sizeof(PathChallenge));
    std::memcpy(pkt.payload.data(), &challenge, sizeof(PathChallenge));
    
    {
        std::lock_guard<std::mutex> lock(paths_mutex_);
        std::string key = addr_to_key(to_addr);
        auto it = peer_paths_.find(key);
        if (it != peer_paths_.end()) {
            std::memcpy(it->second.challenge_data, challenge.challenge_data, sizeof(uint64_t) * 2);
            it->second.last_challenge_time = std::chrono::steady_clock::now();
            it->second.challenge_attempts++;
            it->second.status = PathStatus::PROBING;
        }
    }
    
    send_packet_to(pkt, to_addr);
}

void Connection::send_path_response(const NetworkAddress& to_addr, const uint64_t data[2]) {
    Packet pkt(PacketType::PATH_RESPONSE, conn_id_, 0, next_connection_seq_++);
    
    PathResponse response;
    std::memcpy(response.response_data, data, sizeof(uint64_t) * 2);
    
    pkt.payload.resize(sizeof(PathResponse));
    std::memcpy(pkt.payload.data(), &response, sizeof(PathResponse));
    
    send_packet_to(pkt, to_addr);
}

void Connection::send_address_update(const NetworkAddress& new_addr) {
    Packet pkt(PacketType::ADDRESS_UPDATE, conn_id_, 0, next_connection_seq_++);
    
    AddressUpdate addr_update;
    addr_update.ip_type = IPV4;
    
    inet_pton(AF_INET, new_addr.ip.c_str(), addr_update.ip_bytes);
    addr_update.port = htons(new_addr.port);
    
    pkt.payload.resize(sizeof(AddressUpdate));
    std::memcpy(pkt.payload.data(), &addr_update, sizeof(AddressUpdate));
    
    send_packet(pkt);
}

void Connection::send_new_connection_id(uint32_t new_cid, uint8_t sequence) {
    Packet pkt(PacketType::NEW_CONNECTION_ID, conn_id_, 0, next_connection_seq_++);
    
    NewConnectionId new_cid_pkt;
    new_cid_pkt.new_connection_id = new_cid;
    new_cid_pkt.retire_prior_to = 0;
    new_cid_pkt.sequence_number = sequence;
    
    pkt.payload.resize(sizeof(NewConnectionId));
    std::memcpy(pkt.payload.data(), &new_cid_pkt, sizeof(NewConnectionId));
    
    send_packet(pkt);
}

void Connection::check_path_timeouts() {
    std::lock_guard<std::mutex> lock(paths_mutex_);
    auto now = std::chrono::steady_clock::now();
    
    for (auto it = peer_paths_.begin(); it != peer_paths_.end(); ) {
        if (it->second.status == PathStatus::PROBING) {
            auto elapsed = std::chrono::duration_cast<std::chrono::microseconds>(
                now - it->second.last_challenge_time
            ).count();
            
            if (static_cast<uint64_t>(elapsed) > PATH_PROBE_TIMEOUT_US) {
                if (it->second.challenge_attempts >= MAX_PATH_PROBE_ATTEMPTS) {
                    if (it->first == preferred_path_key_) {
                        update_preferred_path();
                    }
                    it->second.status = PathStatus::FAILED;
                    ++it;
                } else {
                    send_path_challenge(it->second.address);
                    ++it;
                }
            } else {
                ++it;
            }
        } else {
            ++it;
        }
    }
    
    if (migration_in_progress_) {
        auto elapsed = std::chrono::duration_cast<std::chrono::microseconds>(
            now - peer_paths_[addr_to_key(pending_migration_addr_)].last_challenge_time
        ).count();
        
        if (static_cast<uint64_t>(elapsed) > PATH_PROBE_TIMEOUT_US * 2) {
            migration_in_progress_ = false;
        }
    }
}

void Connection::event_loop() {
    auto last_retransmit_check = std::chrono::steady_clock::now();
    auto last_path_check = std::chrono::steady_clock::now();
    
    while (running_) {
        Packet packet;
        NetworkAddress from_addr;
        
        if (socket_->receive_from(packet, from_addr, 2)) {
            process_packet(packet, from_addr);
        }
        
        auto now = std::chrono::steady_clock::now();
        
        if (now - last_retransmit_check >= std::chrono::milliseconds(10)) {
            process_retransmissions();
            last_retransmit_check = now;
        }
        
        if (now - last_path_check >= std::chrono::milliseconds(100)) {
            check_path_timeouts();
            check_timeouts();
            last_path_check = now;
        }
        
        if (state_ == ConnectionState::ESTABLISHED) {
            std::lock_guard<std::mutex> lock(streams_mutex_);
            for (auto& pair : streams_) {
                auto& stream = pair.second;
                if (stream->sender && !stream->sender->is_complete()) {
                    int packets_sent = 0;
                    const int max_burst = 64;
                    
                    while (packets_sent < max_burst) {
                        std::vector<uint8_t> data;
                        uint64_t chunk_index;
                        
                        if (!stream->sender->get_next_chunk(data, chunk_index)) {
                            break;
                        }
                        
                        if (!stream->congestion.can_send(data.size())) {
                            break;
                        }
                        
                        Packet pkt(PacketType::DATA, conn_id_, stream->stream_id,
                                    stream->next_sequence++);
                        
                        pkt.payload.resize(sizeof(uint64_t) + data.size());
                        *reinterpret_cast<uint64_t*>(pkt.payload.data()) = chunk_index;
                        std::memcpy(pkt.payload.data() + sizeof(uint64_t),
                                    data.data(), data.size());
                        
                        RetransmissionInfo retrans;
                        retrans.packet = pkt;
                        retrans.send_time = std::chrono::steady_clock::now();
                        retrans.retransmit_count = 0;
                        stream->retransmission_queue[pkt.header.sequence_number] = retrans;
                        
                        send_packet(pkt);
                        stream->congestion.increase_bytes_in_flight(data.size());
                        stats_.transfer_stats().record_packet_sent(pkt.payload.size());
                        
                        packets_sent++;
                    }
                }
            }
        }
        
        std::unique_lock<std::mutex> send_lock(send_mutex_);
        while (!send_queue_.empty()) {
            Packet pkt = send_queue_.front();
            send_queue_.pop();
            send_lock.unlock();
            
            send_packet(pkt);
            
            send_lock.lock();
        }
    }
}

bool Connection::verify_connection_id(uint32_t cid) const {
    std::lock_guard<std::mutex> lock(cids_mutex_);
    
    for (const auto& cid_info : active_cids_) {
        if (cid_info.connection_id == cid && cid_info.is_active) {
            return true;
        }
    }
    
    return false;
}

PathInfo* Connection::get_or_create_path(const NetworkAddress& addr) {
    std::string key = addr_to_key(addr);
    auto it = peer_paths_.find(key);
    if (it != peer_paths_.end()) {
        return &(it->second);
    }
    
    if (peer_paths_.size() >= MAX_PATHS_PER_CONNECTION) {
        return nullptr;
    }
    
    PathInfo path;
    path.address = addr;
    path.status = PathStatus::UNKNOWN;
    path.last_active_time = std::chrono::steady_clock::now();
    path.rtt_us = 100000;
    path.challenge_attempts = 0;
    path.is_preferred = false;
    
    peer_paths_[key] = path;
    return &peer_paths_[key];
}

void Connection::update_preferred_path() {
    for (auto& pair : peer_paths_) {
        if (pair.second.status == PathStatus::VALIDATED) {
            preferred_path_key_ = pair.first;
            pair.second.is_preferred = true;
            peer_addr_ = pair.second.address;
            return;
        }
    }
}

bool Connection::validate_new_path(const NetworkAddress& addr) {
    std::lock_guard<std::mutex> lock(paths_mutex_);
    PathInfo* path = get_or_create_path(addr);
    if (!path) {
        return false;
    }
    
    if (path->status == PathStatus::VALIDATED) {
        return true;
    }
    
    if (path->status == PathStatus::PROBING) {
        return false;
    }
    
    send_path_challenge(addr);
    return true;
}

std::string Connection::addr_to_key(const NetworkAddress& addr) const {
    return addr.ip + ":" + std::to_string(addr.port);
}

NetworkAddress Connection::addr_from_key(const std::string& key) const {
    size_t colon_pos = key.find(':');
    if (colon_pos == std::string::npos) {
        return NetworkAddress();
    }
    
    NetworkAddress addr;
    addr.ip = key.substr(0, colon_pos);
    addr.port = static_cast<uint16_t>(std::stoi(key.substr(colon_pos + 1)));
    return addr;
}

void Connection::generate_challenge_data(uint64_t data[2]) {
    static std::random_device rd;
    static std::mt19937_64 gen(rd());
    
    data[0] = gen();
    data[1] = gen();
}

bool Connection::verify_challenge_data(const uint64_t received[2], const uint64_t expected[2]) const {
    return received[0] == expected[0] && received[1] == expected[1];
}
