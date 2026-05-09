package com.bikesharing.platform.controller;

import com.bikesharing.platform.dto.DispatchSuggestionDTO;
import com.bikesharing.platform.service.DispatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dispatch")
@RequiredArgsConstructor
public class DispatchController {

    private final DispatchService dispatchService;

    @GetMapping("/suggestions")
    public ResponseEntity<List<DispatchSuggestionDTO>> getDispatchSuggestions() {
        List<DispatchSuggestionDTO> suggestions = dispatchService.generateDispatchSuggestions();
        return ResponseEntity.ok(suggestions);
    }
}
