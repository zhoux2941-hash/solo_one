package com.prison.call.controller;

import com.prison.call.entity.SensitiveWord;
import com.prison.call.service.SensitiveWordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sensitive-words")
@CrossOrigin(origins = "*")
public class SensitiveWordController {
    
    @Autowired
    private SensitiveWordService sensitiveWordService;
    
    @GetMapping
    public ResponseEntity<List<SensitiveWord>> getAllWords() {
        return ResponseEntity.ok(sensitiveWordService.getAllWords());
    }
    
    @PostMapping("/detect")
    public ResponseEntity<List<String>> detectSensitiveWords(@RequestBody Map<String, String> request) {
        String text = request.getOrDefault("text", "");
        return ResponseEntity.ok(sensitiveWordService.detectSensitiveWords(text));
    }
    
    @PostMapping
    public ResponseEntity<SensitiveWord> addWord(@RequestBody SensitiveWord word) {
        return ResponseEntity.ok(sensitiveWordService.addWord(word));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWord(@PathVariable Long id) {
        sensitiveWordService.deleteWord(id);
        return ResponseEntity.ok().build();
    }
}
