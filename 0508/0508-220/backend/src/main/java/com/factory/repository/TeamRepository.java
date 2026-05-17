package com.factory.repository;

import com.factory.entity.Team;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByTeamCode(String teamCode);
    boolean existsByTeamCode(String teamCode);
    List<Team> findByLineId(Long lineId);
    Page<Team> findByTeamNameContaining(String teamName, Pageable pageable);
}