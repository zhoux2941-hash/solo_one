package com.petboarding.repository;

import com.petboarding.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByCenterId(Long centerId);
    
    List<Room> findByRoomType(String roomType);
    
    @Query("SELECT r FROM Room r WHERE r.centerId = :centerId")
    List<Room> findRoomsByCenterId(@Param("centerId") Long centerId);
    
    @Query("SELECT DISTINCT r.roomType FROM Room r")
    List<String> findAllRoomTypes();
}
