package com.woodjoin.controller;

import com.woodjoin.enums.JoinType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class InfoController {

    @GetMapping("/join-types")
    public ResponseEntity<List<Map<String, String>>> getJoinTypes() {
        List<Map<String, String>> types = Arrays.stream(JoinType.values())
                .map(type -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("code", type.name());
                    map.put("name", type.getDisplayName());
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(types);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
}