package com.homework.service;

import com.homework.entity.Homework;
import com.homework.entity.User;
import com.homework.exception.BusinessException;
import com.homework.repository.HomeworkRepository;
import com.homework.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class HomeworkService {
    @Autowired
    private HomeworkRepository homeworkRepository;
    
    @Autowired
    private UserRepository userRepository;

    public Homework createHomework(Homework homework, Long teacherId) {
        if (homework.getDeadline() == null) {
            throw new BusinessException("截止时间不能为空");
        }
        if (homework.getDeadline().isBefore(LocalDateTime.now())) {
            throw new BusinessException("截止时间必须晚于当前时间");
        }
        if (homework.getTitle() == null || homework.getTitle().trim().isEmpty()) {
            throw new BusinessException("作业标题不能为空");
        }
        
        User teacher = userRepository.findById(teacherId).orElseThrow();
        homework.setTeacher(teacher);
        homework.setClassName(teacher.getClassName());
        return homeworkRepository.save(homework);
    }

    public List<Homework> getHomeworksByTeacher(Long teacherId) {
        return homeworkRepository.findByTeacherId(teacherId);
    }

    public Map<String, Object> getHomeworksByClassName(String className, Integer page, Integer size) {
        List<Homework> homeworks = homeworkRepository.findByClassNameOrderByCreatedAtDesc(className);
        
        int pageSize = size != null ? size : 10;
        int pageNum = page != null ? page : 1;
        int total = homeworks.size();
        int totalPages = (int) Math.ceil((double) total / pageSize);
        int start = (pageNum - 1) * pageSize;
        int end = Math.min(start + pageSize, total);
        
        List<Homework> pagedList = homeworks.subList(start, end);
        
        Map<String, Object> result = new HashMap<>();
        result.put("homeworks", pagedList);
        result.put("currentPage", pageNum);
        result.put("totalPages", totalPages);
        result.put("pageSize", pageSize);
        result.put("total", total);
        
        return result;
    }

    public List<Homework> getHomeworksByClassName(String className) {
        return homeworkRepository.findByClassNameOrderByCreatedAtDesc(className);
    }

    public Optional<Homework> getHomeworkById(Long id) {
        return homeworkRepository.findById(id);
    }

    public Homework updateHomework(Homework homework) {
        Homework existing = homeworkRepository.findById(homework.getId()).orElseThrow();
        
        if (homework.getDeadline() != null) {
            if (homework.getDeadline().isBefore(LocalDateTime.now())) {
                throw new BusinessException("截止时间必须晚于当前时间");
            }
        }
        
        if (homework.getTitle() != null && homework.getTitle().trim().isEmpty()) {
            throw new BusinessException("作业标题不能为空");
        }
        
        if (homework.getTitle() != null) {
            existing.setTitle(homework.getTitle());
        }
        if (homework.getDescription() != null) {
            existing.setDescription(homework.getDescription());
        }
        if (homework.getDeadline() != null) {
            existing.setDeadline(homework.getDeadline());
        }
        if (homework.getAttachmentRequirement() != null) {
            existing.setAttachmentRequirement(homework.getAttachmentRequirement());
        }
        
        return homeworkRepository.save(existing);
    }

    public void deleteHomework(Long id) {
        homeworkRepository.deleteById(id);
    }
}
