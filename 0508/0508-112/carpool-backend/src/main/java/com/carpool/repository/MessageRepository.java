package com.carpool.repository;

import com.carpool.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByGroupIdOrderByCreatedAtAsc(Long groupId);

    List<Message> findByGroupIdOrderByCreatedAtDesc(Long groupId);
}
