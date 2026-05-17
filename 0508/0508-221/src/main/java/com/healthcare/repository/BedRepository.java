package com.healthcare.repository;

import com.healthcare.entity.Bed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long>, JpaSpecificationExecutor<Bed> {
    List<Bed> findByRoomId(Long roomId);
    boolean existsByBedNo(String bedNo);
    boolean existsByBedNoAndIdNot(String bedNo, Long id);
}