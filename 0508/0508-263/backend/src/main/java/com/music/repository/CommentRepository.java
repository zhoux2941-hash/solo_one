package com.music.repository;

import com.music.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByMusicIdOrderByCreatedAtDesc(Long musicId);

    List<Comment> findByUserId(Long userId);

    List<Comment> findByParentId(Long parentId);
}
