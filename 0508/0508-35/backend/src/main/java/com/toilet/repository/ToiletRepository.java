package com.toilet.repository;

import com.toilet.entity.Toilet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ToiletRepository extends JpaRepository<Toilet, Long> {
    Toilet findByCode(String code);
}
