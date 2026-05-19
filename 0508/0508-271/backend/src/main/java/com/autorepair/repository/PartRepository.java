package com.autorepair.repository;

import com.autorepair.entity.Part;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartRepository extends JpaRepository<Part, Long> {
    List<Part> findByNameContainingOrPartNoContaining(String name, String partNo);
    List<Part> findByStockLessThanEqual(Integer warningStock);
}