package com.crew.service;

import com.crew.config.JwtConfig;
import com.crew.dto.LoginRequest;
import com.crew.entity.Role;
import com.crew.entity.User;
import com.crew.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtConfig jwtConfig;
    
    @PostConstruct
    public void init() {
        if (userRepository.count() == 0) {
            User director = new User();
            director.setUsername("director");
            director.setPassword(passwordEncoder.encode("123456"));
            director.setName("张导演");
            director.setRole(Role.DIRECTOR);
            userRepository.save(director);
            
            User actor1 = new User();
            actor1.setUsername("actor1");
            actor1.setPassword(passwordEncoder.encode("123456"));
            actor1.setName("李演员");
            actor1.setRole(Role.ACTOR);
            userRepository.save(actor1);
            
            User actor2 = new User();
            actor2.setUsername("actor2");
            actor2.setPassword(passwordEncoder.encode("123456"));
            actor2.setName("王演员");
            actor2.setRole(Role.ACTOR);
            userRepository.save(actor2);
            
            User actor3 = new User();
            actor3.setUsername("actor3");
            actor3.setPassword(passwordEncoder.encode("123456"));
            actor3.setName("赵演员");
            actor3.setRole(Role.ACTOR);
            userRepository.save(actor3);
            
            User pa = new User();
            pa.setUsername("pa");
            pa.setPassword(passwordEncoder.encode("123456"));
            pa.setName("片场务");
            pa.setRole(Role.PRODUCTION_ASSISTANT);
            userRepository.save(pa);
        }
    }
    
    public String login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("用户名或密码错误"));
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }
        
        return jwtConfig.generateToken(user.getUsername(), user.getRole().name(), user.getId());
    }
    
    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
    }
    
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
    }
    
    public List<User> findAllActors() {
        return userRepository.findByRole(Role.ACTOR);
    }
}