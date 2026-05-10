package com.opera.mask.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.opera.mask.entity.Comment;

import java.util.List;

public interface CommentService extends IService<Comment> {
    Comment addComment(Long designId, Long userId, String userName, String content, Long parentId);

    List<Comment> getCommentsByDesignId(Long designId);

    void deleteComment(Long id, Long userId);
}
