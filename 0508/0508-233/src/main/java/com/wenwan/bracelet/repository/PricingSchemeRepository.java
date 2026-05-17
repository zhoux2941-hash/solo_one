package com.wenwan.bracelet.repository;

import com.wenwan.bracelet.entity.PricingScheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PricingSchemeRepository extends JpaRepository<PricingScheme, Long> {

    List<PricingScheme> findByCraftsmanId(Long craftsmanId);

    Optional<PricingScheme> findByCraftsmanIdAndIsDefaultTrue(Long craftsmanId);
}