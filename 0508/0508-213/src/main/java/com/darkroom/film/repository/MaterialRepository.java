package com.darkroom.film.repository;

import com.darkroom.film.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {
    List<Material> findByType(String type);
    List<Material> findByNameContaining(String name);
}