package com.homework.service;

import com.homework.entity.User;
import com.homework.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    public void initDefaultUsers() {
        if (userRepository.count() == 0) {
            User teacher = new User();
            teacher.setUsername("teacher");
            teacher.setPassword("123456");
            teacher.setName("张老师");
            teacher.setRole(User.Role.TEACHER);
            teacher.setClassName("高三(1)班");
            userRepository.save(teacher);

            String[] studentNames = {"小明", "小红", "小华", "小李", "小王", "小张", "小刘", "小陈"};
            for (int i = 0; i < studentNames.length; i++) {
                User student = new User();
                student.setUsername("student" + (i + 1));
                student.setPassword("123456");
                student.setName(studentNames[i]);
                student.setRole(User.Role.STUDENT);
                student.setClassName("高三(1)班");
                userRepository.save(student);
            }
        }
    }

    public Optional<User> login(String username, String password) {
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent() && user.get().getPassword().equals(password)) {
            return user;
        }
        return Optional.empty();
    }

    public List<User> getAllStudents() {
        return userRepository.findByRole(User.Role.STUDENT);
    }

    public List<User> getStudentsByClassName(String className) {
        return userRepository.findByRoleAndClassName(User.Role.STUDENT, className);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
}
