package com.construction.progress.service;

import com.construction.progress.dto.CommentDTO;
import com.construction.progress.entity.Comment;
import com.construction.progress.repository.CommentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private final CommentRepository commentRepository;

    public CommentService(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    @Transactional
    public Map<String, Object> createComment(Long ownerId, CommentDTO commentDTO) {
        Comment comment = new Comment();
        comment.setProjectId(commentDTO.getProjectId());
        comment.setOwnerId(ownerId);
        comment.setContent(commentDTO.getContent());
        comment.setType(Comment.Type.valueOf(commentDTO.getType().toUpperCase()));
        comment.setIsRead(false);
        
        Comment savedComment = commentRepository.save(comment);
        return convertToCommentDetail(savedComment);
    }

    public List<Map<String, Object>> getProjectComments(Long projectId) {
        List<Comment> comments = commentRepository.findByProjectIdOrderByCreateTimeDesc(projectId);
        return comments.stream()
                .map(this::convertToCommentDetail)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getOwnerComments(Long ownerId) {
        List<Comment> comments = commentRepository.findByOwnerIdOrderByCreateTimeDesc(ownerId);
        return comments.stream()
                .map(this::convertToCommentDetail)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("留言不存在"));
        comment.setIsRead(true);
        commentRepository.save(comment);
    }

    public long getUnreadCount(Long projectId) {
        return commentRepository.countByProjectIdAndIsReadFalse(projectId);
    }

    private Map<String, Object> convertToCommentDetail(Comment comment) {
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("id", comment.getId());
        detail.put("projectId", comment.getProjectId());
        detail.put("ownerId", comment.getOwnerId());
        detail.put("content", comment.getContent());
        detail.put("type", comment.getType().name());
        detail.put("isRead", comment.getIsRead());
        detail.put("createTime", comment.getCreateTime());
        return detail;
    }
}
