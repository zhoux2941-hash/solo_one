package com.petclean.service;

import com.petclean.entity.User;
import com.petclean.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getUsersRanked() {
        return userRepository.findAllByOrderByTotalPointsDesc();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional
    public User createUser(String username, String nickname, Long buildingId) {
        User user = new User();
        user.setUsername(username);
        user.setNickname(nickname);
        user.setBuildingId(buildingId);
        user.setTotalPoints(0);
        user.setIsAdmin(false);
        return userRepository.save(user);
    }

    @Transactional
    public User updatePoints(Long userId, int points) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setTotalPoints(user.getTotalPoints() + points);
        return userRepository.save(user);
    }
}
