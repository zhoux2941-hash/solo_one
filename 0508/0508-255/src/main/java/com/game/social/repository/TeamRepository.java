package com.game.social.repository;

import com.game.social.entity.Team;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    Optional<Team> findByName(String name);

    List<Team> findByStatus(String status);

    Page<Team> findByStatus(String status, Pageable pageable);

    List<Team> findByLeaderId(Long leaderId);
}
