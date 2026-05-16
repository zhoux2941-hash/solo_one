package com.homework.controller;

import com.homework.entity.Homework;
import com.homework.service.HomeworkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/homeworks")
@CrossOrigin(origins = "*")
public class HomeworkController {
    @Autowired
    private HomeworkService homeworkService;

    @PostMapping
    public ResponseEntity<?> createHomework(@RequestBody Map<String, Object> request) {
        Homework homework = new Homework();
        homework.setTitle((String) request.get("title"));
        homework.setDescription((String) request.get("description"));
        homework.setDeadline(java.time.LocalDateTime.parse((String) request.get("deadline")));
        homework.setAttachmentRequirement((String) request.get("attachmentRequirement"));
        
        Long teacherId = Long.valueOf(request.get("teacherId").toString());
        Homework created = homeworkService.createHomework(homework, teacherId);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<?> getHomeworksByTeacher(@PathVariable Long teacherId) {
        List<Homework> homeworks = homeworkService.getHomeworksByTeacher(teacherId);
        return ResponseEntity.ok(homeworks);
    }

    @GetMapping("/class/{className}")
    public ResponseEntity<?> getHomeworksByClass(
            @PathVariable String className,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer size) {
        Map<String, Object> result = homeworkService.getHomeworksByClassName(className, page, size);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHomeworkById(@PathVariable Long id) {
        Optional<Homework> homework = homeworkService.getHomeworkById(id);
        return homework.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateHomework(@PathVariable Long id, @RequestBody Homework homework) {
        homework.setId(id);
        Homework updated = homeworkService.updateHomework(homework);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHomework(@PathVariable Long id) {
        homeworkService.deleteHomework(id);
        return ResponseEntity.ok().build();
    }
}
