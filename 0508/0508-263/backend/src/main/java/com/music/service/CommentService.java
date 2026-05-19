package com.music.service;

import com.music.dto.ApiResponse;
import com.music.dto.CommentDTO;
import com.music.entity.Comment;
import com.music.entity.Music;
import com.music.entity.User;
import com.music.repository.CommentRepository;
import com.music.repository.MusicRepository;
import com.music.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MusicRepository musicRepository;

    @Transactional
    public ApiResponse<CommentDTO> createComment(Long userId, Long musicId, String content, Long parentId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ApiResponse.error("用户不存在");
        }

        Music music = musicRepository.findById(musicId).orElse(null);
        if (music == null) {
            return ApiResponse.error("音乐不存在");
        }

        Comment comment = new Comment();
        comment.setUser(user);
        comment.setMusic(music);
        comment.setContent(content);

        if (parentId != null) {
            Comment parent = commentRepository.findById(parentId).orElse(null);
            if (parent != null) {
                comment.setParent(parent);
            }
        }

        comment = commentRepository.save(comment);
        return ApiResponse.success("评论成功", CommentDTO.fromEntity(comment));
    }

    public ApiResponse<List<CommentDTO>> getMusicComments(Long musicId) {
        List<Comment> comments = commentRepository.findByMusicIdOrderByCreatedAtDesc(musicId);
        List<CommentDTO> dtoList = comments.stream().map(CommentDTO::fromEntity).collect(Collectors.toList());
        return ApiResponse.success(dtoList);
    }

    @Transactional
    public ApiResponse<String> deleteComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null) {
            return ApiResponse.error("评论不存在");
        }

        if (!comment.getUser().getId().equals(userId)) {
            return ApiResponse.error("无权删除此评论");
        }

        commentRepository.delete(comment);
        return ApiResponse.success("删除成功", null);
    }
}
