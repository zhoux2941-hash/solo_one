package com.meteor.repository;

import com.meteor.entity.Constellation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConstellationRepository extends JpaRepository<Constellation, Long> {
    Optional<Constellation> findByName(String name);

    Optional<Constellation> findByAbbreviation(String abbreviation);

    List<Constellation> findAllByOrderByDisplayName();

    @Query("SELECT c FROM Constellation c WHERE :ra BETWEEN c.boundaryMinRA AND c.boundaryMaxRA AND :dec BETWEEN c.boundaryMinDec AND c.boundaryMaxDec")
    List<Constellation> findByCoordinates(@Param("ra") Double ra, @Param("dec") Double dec);

    @Query("SELECT c FROM Constellation c ORDER BY c.displayOrder")
    List<Constellation> findAllOrderByDisplayOrder();
}
