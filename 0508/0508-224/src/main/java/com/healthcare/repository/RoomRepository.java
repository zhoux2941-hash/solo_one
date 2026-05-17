package com.healthcare.repository;

import com.healthcare.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long>, JpaSpecificationExecutor<Room> {
    boolean existsByRoomNo(String roomNo);
    boolean existsByRoomNoAndIdNot(String roomNo, Long id);
}