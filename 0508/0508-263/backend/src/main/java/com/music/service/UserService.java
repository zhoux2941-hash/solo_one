package com.music.service;

import com.music.dto.ApiResponse;
import com.music.dto.MusicDTO;
import com.music.dto.UserDTO;
import com.music.entity.PlayHistory;
import com.music.entity.User;
import com.music.repository.PlayHistoryRepository;
import com.music.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlayHistoryRepository playHistoryRepository;

    public ApiResponse<UserDTO> getUserProfile(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ApiResponse.error("用户不存在");
        }
        return ApiResponse.success(UserDTO.fromEntity(user));
    }

    public ApiResponse<List<MusicDTO>> getPlayHistory(Long userId, int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "playedAt"));
        List<PlayHistory> historyList = playHistoryRepository.findByUserId(userId, pageable);
        List<MusicDTO> dtoList = historyList.stream()
                .map(h -> MusicDTO.fromEntity(h.getMusic()))
                .distinct()
                .collect(Collectors.toList());
        return ApiResponse.success(dtoList);
    }

    public ApiResponse<UserDTO> updateProfile(Long userId, String nickname, String bio) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ApiResponse.error("用户不存在");
        }

        if (nickname != null) {
            user.setNickname(nickname);
        }
        if (bio != null) {
            user.setBio(bio);
        }

        user = userRepository.save(user);
        return ApiResponse.success("更新成功", UserDTO.fromEntity(user));
    }
}
