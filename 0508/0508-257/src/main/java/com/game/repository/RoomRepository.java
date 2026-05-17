package com.game.repository;

import com.game.entity.Room;
import com.game.entity.RoomStatus;
import com.game.entity.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByRoomNumber(String roomNumber);

    List<Room> findByRoomType(RoomType roomType);

    List<Room> findByStatus(RoomStatus status);

    List<Room> findByRoomTypeAndStatus(RoomType roomType, RoomStatus status);

    List<Room> findByOwnerId(Long ownerId);

    long countByStatus(RoomStatus status);
}