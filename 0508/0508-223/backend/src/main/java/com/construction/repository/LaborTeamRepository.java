package com.construction.repository;

import com.construction.entity.LaborTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LaborTeamRepository extends JpaRepository<LaborTeam, Long>, JpaSpecificationExecutor<LaborTeam> {

    List<LaborTeam> findByProjectIdAndStatus(Long projectId, Integer status);

    boolean existsByTeamNameAndProjectId(String teamName, Long projectId);

    boolean existsByTeamNameAndProjectIdAndIdNot(String teamName, Long projectId, Long id);
}
