package com.oceanheritage.repository;

import com.oceanheritage.entity.ProtectedArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProtectedAreaRepository extends JpaRepository<ProtectedArea, Long> {

    List<ProtectedArea> findByEnabledTrue();
}
