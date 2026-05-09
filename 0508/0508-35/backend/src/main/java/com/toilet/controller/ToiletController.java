package com.toilet.controller;

import com.toilet.service.ToiletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/toilets")
@CrossOrigin(origins = "*")
public class ToiletController {

    @Autowired
    private ToiletService toiletService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllToilets() {
        List<Map<String, Object>> toilets = toiletService.getAllToiletsWithLevels();
        
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("code", 200);
        response.put("message", "success");
        response.put("data", toilets);
        
        return ResponseEntity.ok(response);
    }
}
