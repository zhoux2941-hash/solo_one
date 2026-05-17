package com.scenic.repository;

import com.scenic.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PositionRepository extends JpaRepository<Position, Long>, JpaSpecificationExecutor<Position> {

    Optional<Position> findByPositionCode(String positionCode);

    Optional<Position> findByPositionName(String positionName);

    List<Position> findByStatus(Boolean status);

    boolean existsByPositionCode(String positionCode);

    boolean existsByPositionName(String positionName);
}
