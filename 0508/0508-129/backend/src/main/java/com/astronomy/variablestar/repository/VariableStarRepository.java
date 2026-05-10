package com.astronomy.variablestar.repository;

import com.astronomy.variablestar.entity.VariableStar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VariableStarRepository extends JpaRepository<VariableStar, Long> {

    List<VariableStar> findByStarType(String starType);

    List<VariableStar> findByConstellation(String constellation);

    @Query("SELECT DISTINCT v.starType FROM VariableStar v ORDER BY v.starType")
    List<String> findDistinctStarTypes();

    @Query("SELECT DISTINCT v.constellation FROM VariableStar v ORDER BY v.constellation")
    List<String> findDistinctConstellations();
}
