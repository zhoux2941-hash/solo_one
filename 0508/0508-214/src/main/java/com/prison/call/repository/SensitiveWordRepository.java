package com.prison.call.repository;

import com.prison.call.entity.SensitiveWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SensitiveWordRepository extends JpaRepository<SensitiveWord, Long> {
    List<SensitiveWord> findByEnabledTrue();
    SensitiveWord findByWord(String word);
}
