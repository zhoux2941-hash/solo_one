package com.community.station.repository;

import com.community.station.entity.CourierCompany;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourierCompanyRepository extends JpaRepository<CourierCompany, Long> {

    Optional<CourierCompany> findByCompanyCode(String companyCode);

    boolean existsByCompanyCode(String companyCode);

    List<CourierCompany> findByEnabled(Boolean enabled);

    Page<CourierCompany> findAll(Pageable pageable);
}
