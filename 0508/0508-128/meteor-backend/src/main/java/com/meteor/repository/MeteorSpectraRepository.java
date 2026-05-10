package com.meteor.repository;

import com.meteor.entity.MeteorSpectra;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MeteorSpectraRepository extends JpaRepository<MeteorSpectra, Long> {
    
    @Query("SELECT DISTINCT ms FROM MeteorSpectra ms " +
           "LEFT JOIN ms.emissionLines el " +
           "WHERE (:element IS NULL OR el.element = :element) " +
           "AND (:minVelocity IS NULL OR ms.velocity >= :minVelocity) " +
           "AND (:maxVelocity IS NULL OR ms.velocity <= :maxVelocity) " +
           "AND (:uploaderName IS NULL OR ms.uploaderName LIKE %:uploaderName%)")
    Page<MeteorSpectra> searchSpectra(
            @Param("element") String element,
            @Param("minVelocity") Double minVelocity,
            @Param("maxVelocity") Double maxVelocity,
            @Param("uploaderName") String uploaderName,
            Pageable pageable);
    
    Page<MeteorSpectra> findAllByOrderByUploadTimeDesc(Pageable pageable);
}
