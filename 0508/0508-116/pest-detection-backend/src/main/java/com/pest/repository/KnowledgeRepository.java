package com.pest.repository;

import com.pest.entity.Knowledge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KnowledgeRepository extends JpaRepository<Knowledge, Long> {
    List<Knowledge> findByExpertIdOrderByUpdateTimeDesc(Long expertId);
    List<Knowledge> findByCropTypeOrderByUpdateTimeDesc(String cropType);
    List<Knowledge> findAllByOrderByUpdateTimeDesc();

    @Query("SELECT k FROM Knowledge k WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR k.title LIKE %:keyword% OR k.content LIKE %:keyword% OR k.pestName LIKE %:keyword%) AND " +
           "(:cropType IS NULL OR :cropType = '' OR k.cropType = :cropType) " +
           "ORDER BY k.updateTime DESC")
    List<Knowledge> search(
            @Param("keyword") String keyword,
            @Param("cropType") String cropType
    );
}