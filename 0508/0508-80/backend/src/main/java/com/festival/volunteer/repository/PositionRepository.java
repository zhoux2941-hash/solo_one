package com.festival.volunteer.repository;

import com.festival.volunteer.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {
    List<Position> findByStatus(Position.PositionStatus status);
    List<Position> findByType(Position.PositionType type);
    List<Position> findByStatusIn(List<Position.PositionStatus> statuses);
}
