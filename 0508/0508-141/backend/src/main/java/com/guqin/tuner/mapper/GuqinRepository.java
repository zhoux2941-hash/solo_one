package com.guqin.tuner.mapper;

import com.guqin.tuner.entity.Guqin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GuqinRepository extends JpaRepository<Guqin, Long> {
}
