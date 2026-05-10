package com.meme.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.meme.dto.CommentRequest;
import com.meme.entity.Comment;
import com.meme.entity.User;
import com.meme.mapper.CommentMapper;
import com.meme.mapper.UserMapper;
import com.meme.vo.CommentVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CommentService {

    @Autowired
    private CommentMapper commentMapper;

    @Autowired
    private UserMapper userMapper;

    public Comment addComment(CommentRequest request, Long userId) {
        Comment comment = new Comment();
        comment.setMemeId(request.getMemeId());
        comment.setUserId(userId);
        comment.setParentId(request.getParentId() != null ? request.getParentId() : 0L);
        comment.setReplyToId(request.getReplyToId());
        comment.setContent(request.getContent());
        comment.setCreatedAt(LocalDateTime.now());

        commentMapper.insert(comment);
        return comment;
    }

    public List<CommentVO> getComments(Long memeId) {
        QueryWrapper<Comment> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("meme_id", memeId)
                    .eq("deleted", 0)
                    .orderByDesc("created_at");
        
        List<Comment> comments = commentMapper.selectList(queryWrapper);
        
        if (comments.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> userIds = comments.stream()
                .map(Comment::getUserId)
                .distinct()
                .collect(Collectors.toList());
        
        QueryWrapper<User> userQuery = new QueryWrapper<>();
        userQuery.in("id", userIds);
        List<User> users = userMapper.selectList(userQuery);
        Map<Long, String> userMap = users.stream()
                .collect(Collectors.toMap(User::getId, u -> u.getNickname() != null ? u.getNickname() : u.getUsername()));

        List<Comment> topLevelComments = comments.stream()
                .filter(c -> c.getParentId() == null || c.getParentId() == 0)
                .collect(Collectors.toList());

        List<CommentVO> result = new ArrayList<>();
        for (Comment topComment : topLevelComments) {
            CommentVO vo = toCommentVO(topComment, userMap);
            
            List<Comment> replies = comments.stream()
                    .filter(c -> c.getParentId() != null && c.getParentId().equals(topComment.getId()))
                    .collect(Collectors.toList());
            
            List<CommentVO> replyVOs = replies.stream()
                    .map(r -> toCommentVO(r, userMap))
                    .collect(Collectors.toList());
            
            vo.setReplies(replyVOs);
            result.add(vo);
        }

        return result;
    }

    private CommentVO toCommentVO(Comment comment, Map<Long, String> userMap) {
        CommentVO vo = new CommentVO();
        vo.setId(comment.getId());
        vo.setMemeId(comment.getMemeId());
        vo.setUserId(comment.getUserId());
        vo.setParentId(comment.getParentId());
        vo.setReplyToId(comment.getReplyToId());
        vo.setContent(comment.getContent());
        vo.setCreatedAt(comment.getCreatedAt());
        vo.setNickname(userMap.get(comment.getUserId()));
        
        if (comment.getReplyToId() != null) {
            vo.setReplyToNickname(userMap.get(comment.getReplyToId()));
        }
        
        return vo;
    }
}
