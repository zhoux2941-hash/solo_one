package com.opera.mask.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.opera.mask.entity.Comment;
import com.opera.mask.mapper.CommentMapper;
import com.opera.mask.service.CommentService;
import com.opera.mask.service.UserDesignService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl extends ServiceImpl<CommentMapper, Comment> implements CommentService {

    private final UserDesignService userDesignService;

    @Override
    public Comment addComment(Long designId, Long userId, String userName, String content, Long parentId) {
        Comment comment = new Comment();
        comment.setDesignId(designId);
        comment.setUserId(userId);
        comment.setUserName(userName);
        comment.setContent(content);
        comment.setParentId(parentId);
        comment.setLikeCount(0);
        comment.setCreateTime(LocalDateTime.now());
        comment.setDeleted(0);
        save(comment);
        userDesignService.incrementCommentCount(designId);
        return comment;
    }

    @Override
    public List<Comment> getCommentsByDesignId(Long designId) {
        return list(new LambdaQueryWrapper<Comment>()
                .eq(Comment::getDesignId, designId)
                .eq(Comment::getDeleted, 0)
                .orderByDesc(Comment::getCreateTime));
    }

    @Override
    public void deleteComment(Long id, Long userId) {
        Comment comment = getById(id);
        if (comment != null && comment.getUserId().equals(userId)) {
            comment.setDeleted(1);
            updateById(comment);
        }
    }
}
