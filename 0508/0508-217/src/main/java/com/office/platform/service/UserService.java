package com.office.platform.service;

import com.office.platform.common.Result;
import com.office.platform.dto.UserDTO;
import com.office.platform.entity.Department;
import com.office.platform.entity.User;
import com.office.platform.repository.DepartmentRepository;
import com.office.platform.repository.UserRepository;
import com.office.platform.util.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    public Page<User> getUserList(String username, String realName, Long departmentId, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "updateTime"));
        return userRepository.findByConditions(username, realName, departmentId, pageable);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    @Transactional
    public Result<User> createUser(UserDTO userDTO) {
        if (userRepository.existsByUsername(userDTO.getUsername())) {
            return Result.error("用户名已存在");
        }

        User user = new User();
        user.setUsername(userDTO.getUsername());
        user.setPassword(PasswordEncoder.encode(userDTO.getPassword() != null ? userDTO.getPassword() : "123456"));
        user.setRealName(userDTO.getRealName());
        user.setPhone(userDTO.getPhone());
        user.setEmail(userDTO.getEmail());
        user.setRole(userDTO.getRole());
        user.setEnabled(userDTO.getEnabled());

        if (userDTO.getDepartmentId() != null) {
            Department department = departmentRepository.findById(userDTO.getDepartmentId()).orElse(null);
            user.setDepartment(department);
        }

        user = userRepository.save(user);
        return Result.success("创建成功", user);
    }

    @Transactional
    public Result<User> updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return Result.error("用户不存在");
        }

        if (userRepository.existsByUsernameAndIdNot(userDTO.getUsername(), id)) {
            return Result.error("用户名已存在");
        }

        user.setUsername(userDTO.getUsername());
        if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
            user.setPassword(PasswordEncoder.encode(userDTO.getPassword()));
        }
        user.setRealName(userDTO.getRealName());
        user.setPhone(userDTO.getPhone());
        user.setEmail(userDTO.getEmail());
        user.setRole(userDTO.getRole());
        user.setEnabled(userDTO.getEnabled());

        if (userDTO.getDepartmentId() != null) {
            Department department = departmentRepository.findById(userDTO.getDepartmentId()).orElse(null);
            user.setDepartment(department);
        } else {
            user.setDepartment(null);
        }

        user = userRepository.save(user);
        return Result.success("更新成功", user);
    }

    @Transactional
    public Result<String> deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            return Result.error("用户不存在");
        }
        userRepository.deleteById(id);
        return Result.success("删除成功");
    }

    @Transactional
    public Result<String> toggleUserStatus(Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return Result.error("用户不存在");
        }
        user.setEnabled(!user.getEnabled());
        userRepository.save(user);
        return Result.success(user.getEnabled() ? "已启用" : "已禁用");
    }
}