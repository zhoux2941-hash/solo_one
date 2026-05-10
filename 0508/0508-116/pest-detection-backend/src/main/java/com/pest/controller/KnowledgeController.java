package com.pest.controller;

import com.pest.dto.KnowledgeRequest;
import com.pest.entity.Knowledge;
import com.pest.entity.User;
import com.pest.service.KnowledgeService;
import com.pest.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeController {

    @Autowired
    private KnowledgeService knowledgeService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> create(@Validated @RequestBody KnowledgeRequest request) {
        try {
            Knowledge knowledge = new Knowledge();
            knowledge.setExpertId(request.getExpertId());
            knowledge.setTitle(request.getTitle());
            knowledge.setContent(request.getContent());
            knowledge.setCropType(request.getCropType());
            knowledge.setPestName(request.getPestName());

            Knowledge saved = knowledgeService.create(knowledge);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "创建成功");
            result.put("data", enrichKnowledge(saved));
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @Validated @RequestBody KnowledgeRequest request) {
        try {
            Knowledge updateData = new Knowledge();
            updateData.setTitle(request.getTitle());
            updateData.setContent(request.getContent());
            updateData.setCropType(request.getCropType());
            updateData.setPestName(request.getPestName());

            Knowledge updated = knowledgeService.update(id, updateData);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "更新成功");
            result.put("data", enrichKnowledge(updated));
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            knowledgeService.delete(id);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "删除成功");
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            Knowledge knowledge = knowledgeService.getDetail(id);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", enrichKnowledge(knowledge));
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    @GetMapping("/expert/{expertId}")
    public ResponseEntity<?> getByExpert(@PathVariable Long expertId) {
        List<Knowledge> list = knowledgeService.getByExpert(expertId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", enrichKnowledgeList(list));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String cropType) {
        List<Knowledge> list = knowledgeService.search(keyword, cropType);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", enrichKnowledgeList(list));
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        List<Knowledge> list = knowledgeService.getAll();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", enrichKnowledgeList(list));
        return ResponseEntity.ok(result);
    }

    private List<Map<String, Object>> enrichKnowledgeList(List<Knowledge> list) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Knowledge k : list) {
            result.add(enrichKnowledge(k));
        }
        return result;
    }

    private Map<String, Object> enrichKnowledge(Knowledge knowledge) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", knowledge.getId());
        map.put("title", knowledge.getTitle());
        map.put("content", knowledge.getContent());
        map.put("cropType", knowledge.getCropType());
        map.put("pestName", knowledge.getPestName());
        map.put("expertId", knowledge.getExpertId());
        map.put("createTime", knowledge.getCreateTime());
        map.put("updateTime", knowledge.getUpdateTime());
        map.put("viewCount", knowledge.getViewCount());

        try {
            User expert = userService.getById(knowledge.getExpertId());
            map.put("expertName", expert.getName());
        } catch (Exception ignored) {
            map.put("expertName", "未知");
        }

        return map;
    }
}