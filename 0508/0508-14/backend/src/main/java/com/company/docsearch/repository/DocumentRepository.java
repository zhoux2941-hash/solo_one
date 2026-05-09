package com.company.docsearch.repository;

import com.company.docsearch.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {

    @Query("SELECT d FROM Document d WHERE d.title LIKE %:keyword% OR d.content LIKE %:keyword%")
    List<Document> searchByKeyword(@Param("keyword") String keyword);

    @Query("SELECT d.category, SUM(d.clickCount) as cnt FROM Document d GROUP BY d.category")
    List<Object[]> countClickByCategory();

    @Query("SELECT d.docId, d.title, d.clickCount FROM Document d ORDER BY d.clickCount DESC")
    List<Object[]> findTopClickDocuments();

    @Modifying
    @Query("UPDATE Document d SET d.clickCount = d.clickCount + 1 WHERE d.docId = :docId")
    void incrementClickCount(@Param("docId") String docId);
}
