package com.wenwan.bracelet.service;

import com.wenwan.bracelet.entity.User;
import com.wenwan.bracelet.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User login(String username, String password) {
        return userRepository.findByUsernameAndPassword(username, password).orElse(null);
    }

    public User register(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        return userRepository.save(user);
    }

    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public List<User> findAllCraftsmen() {
        return userRepository.findByRole(User.UserRole.CRAFTSMAN);
    }

    public List<User> findPendingCraftsmen() {
        return userRepository.findByRoleAndCraftsmanStatus(User.UserRole.CRAFTSMAN, User.CraftsmanStatus.PENDING);
    }

    public List<User> findApprovedCraftsmen() {
        return userRepository.findByRoleAndCraftsmanStatus(User.UserRole.CRAFTSMAN, User.CraftsmanStatus.APPROVED);
    }

    public User approveCraftsman(Long craftsmanId) {
        User craftsman = findById(craftsmanId);
        if (craftsman != null && craftsman.getRole() == User.UserRole.CRAFTSMAN) {
            craftsman.setCraftsmanStatus(User.CraftsmanStatus.APPROVED);
            craftsman.setApprovedAt(LocalDateTime.now());
            return userRepository.save(craftsman);
        }
        return null;
    }

    public User rejectCraftsman(Long craftsmanId) {
        User craftsman = findById(craftsmanId);
        if (craftsman != null && craftsman.getRole() == User.UserRole.CRAFTSMAN) {
            craftsman.setCraftsmanStatus(User.CraftsmanStatus.REJECTED);
            return userRepository.save(craftsman);
        }
        return null;
    }

    public User updateUser(Long id, User userDetails) {
        User user = findById(id);
        if (user != null) {
            user.setRealName(userDetails.getRealName());
            user.setPhone(userDetails.getPhone());
            user.setEmail(userDetails.getEmail());
            if (user.getRole() == User.UserRole.CRAFTSMAN) {
                user.setCraftsmanProfile(userDetails.getCraftsmanProfile());
                user.setCraftsmanSkills(userDetails.getCraftsmanSkills());
                user.setExperienceYears(userDetails.getExperienceYears());
            }
            return userRepository.save(user);
        }
        return null;
    }

    public List<User> findAllCustomers() {
        return userRepository.findByRole(User.UserRole.CUSTOMER);
    }
}