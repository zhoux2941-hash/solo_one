package com.astronomy.variablestar.repository;

import com.astronomy.variablestar.entity.ReferenceStar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReferenceStarRepository extends JpaRepository<ReferenceStar, Long> {

    List<ReferenceStar> findByVariableStarIdOrderBySequenceOrderAsc(Long variableStarId);
}
