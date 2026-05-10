package com.construction.progress.repository;

import com.construction.progress.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByProjectIdOrderByCreateTimeDesc(Long projectId);
    List<Comment> findByOwnerIdOrderByCreateTimeDesc(Long ownerId);
    long countByProjectIdAndIsReadFalse(Long projectId);
}
