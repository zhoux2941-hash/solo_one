package com.collabdocs.emotionaldocs.repository;

import com.collabdocs.emotionaldocs.entity.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, Long> {
    List<DocumentVersion> findByDocIdOrderByVersionNumberDesc(Long docId);
    
    @Query("SELECT MAX(v.versionNumber) FROM DocumentVersion v WHERE v.docId = :docId")
    Optional<Integer> findMaxVersionNumberByDocId(@Param("docId") Long docId);
    
    List<DocumentVersion> findByDocIdAndUserIdOrderByTimestampDesc(Long docId, Long userId);
}
