package com.game.repository;

import com.game.entity.RoomLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomLogRepository extends JpaRepository<RoomLog, Long> {

    List<RoomLog> findByRoomIdOrderByCreateTimeDesc(Long roomId);

    List<RoomLog> findByPlayerIdOrderByCreateTimeDesc(Long playerId);

    List<RoomLog> findByLogTypeOrderByCreateTimeDesc(RoomLog.LogType logType);

    List<RoomLog> findTop50ByOrderByCreateTimeDesc();
}