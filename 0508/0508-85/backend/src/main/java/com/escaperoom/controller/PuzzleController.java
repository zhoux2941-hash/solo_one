package com.escaperoom.controller;

import com.escaperoom.dto.PuzzleDTO;
import com.escaperoom.service.ScriptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/puzzles")
public class PuzzleController {
    @Autowired
    private ScriptService scriptService;

    @PostMapping
    public PuzzleDTO addPuzzle(@RequestParam Long sceneId, @RequestBody PuzzleDTO dto) {
        return scriptService.addPuzzle(sceneId, dto);
    }

    @PutMapping("/{puzzleId}")
    public PuzzleDTO updatePuzzle(
            @PathVariable Long puzzleId, 
            @RequestBody PuzzleDTO dto,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String userName) {
        String effectiveUserId = userId != null ? userId : "anonymous";
        return scriptService.updatePuzzle(puzzleId, dto, effectiveUserId);
    }

    @PutMapping("/{puzzleId}/force")
    public PuzzleDTO forceUpdatePuzzle(
            @PathVariable Long puzzleId, 
            @RequestBody PuzzleDTO dto,
            @RequestParam(required = false) String userId) {
        String effectiveUserId = userId != null ? userId : "anonymous";
        return scriptService.forceUpdatePuzzle(puzzleId, dto, effectiveUserId);
    }

    @PostMapping("/{puzzleId}/start-editing")
    public ResponseEntity<Map<String, Object>> startEditing(
            @PathVariable Long puzzleId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String userName) {
        String effectiveUserId = userId != null ? userId : "anonymous";
        String effectiveUserName = userName != null ? userName : "匿名用户";
        scriptService.startEditingPuzzle(puzzleId, effectiveUserId, effectiveUserName);
        Map<String, Object> status = scriptService.getPuzzleEditingStatus(puzzleId);
        return ResponseEntity.ok(status);
    }

    @PostMapping("/{puzzleId}/stop-editing")
    public ResponseEntity<Void> stopEditing(
            @PathVariable Long puzzleId,
            @RequestParam(required = false) String userId) {
        String effectiveUserId = userId != null ? userId : "anonymous";
        scriptService.stopEditingPuzzle(puzzleId, effectiveUserId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{puzzleId}/editing-status")
    public ResponseEntity<Map<String, Object>> getEditingStatus(@PathVariable Long puzzleId) {
        Map<String, Object> status = scriptService.getPuzzleEditingStatus(puzzleId);
        return ResponseEntity.ok(status);
    }

    @DeleteMapping("/{puzzleId}")
    public void deletePuzzle(@PathVariable Long puzzleId) {
        scriptService.deletePuzzle(puzzleId);
    }
}
