package com.escaperoom.repository;

import com.escaperoom.entity.Script;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ScriptRepository extends JpaRepository<Script, Long> {
    List<Script> findAllByOrderByUpdatedAtDesc();
}
