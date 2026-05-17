package com.darkroom.film.repository;

import com.darkroom.film.entity.ProcessStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcessStepRepository extends JpaRepository<ProcessStep, Long> {
    List<ProcessStep> findByFilmId(Long filmId);
    List<ProcessStep> findByFilmIdOrderByStartTimeAsc(Long filmId);
}