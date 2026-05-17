package com.darkroom.film.repository;

import com.darkroom.film.entity.FinishedProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FinishedProductRepository extends JpaRepository<FinishedProduct, Long> {
    Optional<FinishedProduct> findByFilmId(Long filmId);
    List<FinishedProduct> findByStatus(String status);
}