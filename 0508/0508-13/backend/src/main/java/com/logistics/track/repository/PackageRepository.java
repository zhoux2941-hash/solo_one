package com.logistics.track.repository;

import com.logistics.track.entity.Package;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PackageRepository extends JpaRepository<Package, Long> {
    
    Optional<Package> findByPackageNo(String packageNo);
    
    boolean existsByPackageNo(String packageNo);
}
