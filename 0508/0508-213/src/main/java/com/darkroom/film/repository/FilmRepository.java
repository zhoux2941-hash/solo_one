package com.darkroom.film.repository;

import com.darkroom.film.entity.Film;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FilmRepository extends JpaRepository<Film, Long> {
    List<Film> findByStatus(String status);
    List<Film> findByCustomerNameContaining(String customerName);
}