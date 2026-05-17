package com.slaughterhouse.repository;

import com.slaughterhouse.entity.Pig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PigRepository extends JpaRepository<Pig, Long> {
    Optional<Pig> findByRfidTag(String rfidTag);
    List<Pig> findByStatus(String status);
    List<Pig> findByQuarantineResult(String quarantineResult);
    Optional<Pig> findByCarcassId(String carcassId);
}
