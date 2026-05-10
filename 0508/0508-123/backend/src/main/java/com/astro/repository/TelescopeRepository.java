package com.astro.repository;

import com.astro.entity.Telescope;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TelescopeRepository extends JpaRepository<Telescope, Long> {
    List<Telescope> findByStatus(String status);
}
