package com.escaperoom.controller;

import com.escaperoom.dto.PuzzleDTO;
import com.escaperoom.dto.ScriptDTO;
import com.escaperoom.dto.test.*;
import com.escaperoom.service.ScriptService;
import com.escaperoom.service.TestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @Autowired
    private ScriptService scriptService;

    @Autowired
    private TestService testService;

    @PostMapping("/{scriptId}/start")
    public ResponseEntity<Map<String, Object>> startTest(@PathVariable Long scriptId) {
        ScriptDTO script = scriptService.getScriptById(scriptId);
        if (script == null) {
            return ResponseEntity.notFound().build();
        }
        
        TestStateDTO state = testService.startTest(script);
        PuzzleDTO currentPuzzle = testService.getCurrentPuzzle(state, script);
        
        Map<String, Object> result = new HashMap<>();
        result.put("state", state);
        result.put("script", script);
        result.put("currentPuzzle", currentPuzzle);
        
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{scriptId}/submit-answer")
    public ResponseEntity<Map<String, Object>> submitAnswer(
            @PathVariable Long scriptId,
            @RequestBody Map<String, Object> request) {
        
        ScriptDTO script = scriptService.getScriptById(scriptId);
        if (script == null) {
            return ResponseEntity.notFound().build();
        }
        
        Long puzzleId = request.get("puzzleId") != null ? 
            Long.valueOf(request.get("puzzleId").toString()) : null;
        String answer = request.get("answer") != null ? 
            request.get("answer").toString() : "";
        
        TestStateDTO state = extractState(request);
        PuzzleDTO puzzle = testService.getCurrentPuzzle(state, script);
        
        Map<String, Object> result = new HashMap<>();
        
        if (puzzle == null) {
            result.put("success", false);
            result.put("message", "当前没有待解决的谜题");
            result.put("state", state);
            return ResponseEntity.ok(result);
        }
        
        if (!puzzle.getId().equals(puzzleId)) {
            result.put("success", false);
            result.put("message", "谜题ID不匹配");
            result.put("state", state);
            return ResponseEntity.ok(result);
        }
        
        boolean correct = testService.checkAnswer(puzzle, answer);
        result.put("success", correct);
        result.put("puzzle", puzzle);
        
        if (correct) {
            TestStateDTO newState = testService.solvePuzzle(state, script, puzzleId);
            result.put("state", newState);
            result.put("message", "答案正确！");
            
            if (newState.getFinished()) {
                result.put("message", "恭喜！您已成功通关！");
            } else {
                PuzzleDTO nextPuzzle = testService.getCurrentPuzzle(newState, script);
                result.put("nextPuzzle", nextPuzzle);
            }
        } else {
            result.put("state", state);
            result.put("message", "答案不正确，请再试一次");
        }
        
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{scriptId}/skip-puzzle")
    public ResponseEntity<Map<String, Object>> skipPuzzle(
            @PathVariable Long scriptId,
            @RequestBody Map<String, Object> request) {
        
        ScriptDTO script = scriptService.getScriptById(scriptId);
        if (script == null) {
            return ResponseEntity.notFound().build();
        }
        
        Long puzzleId = request.get("puzzleId") != null ? 
            Long.valueOf(request.get("puzzleId").toString()) : null;
        
        TestStateDTO state = extractState(request);
        PuzzleDTO puzzle = testService.getCurrentPuzzle(state, script);
        
        Map<String, Object> result = new HashMap<>();
        
        if (puzzle == null) {
            result.put("success", false);
            result.put("message", "当前没有待解决的谜题");
            result.put("state", state);
            return ResponseEntity.ok(result);
        }
        
        TestStateDTO newState = testService.solvePuzzle(state, script, puzzleId);
        result.put("state", newState);
        result.put("puzzle", puzzle);
        
        if (newState.getFinished()) {
            result.put("message", "已跳过谜题，测试完成");
        } else {
            PuzzleDTO nextPuzzle = testService.getCurrentPuzzle(newState, script);
            result.put("nextPuzzle", nextPuzzle);
            result.put("message", "已跳过此谜题");
        }
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{scriptId}/report")
    public ResponseEntity<TestReportDTO> getReport(@PathVariable Long scriptId) {
        ScriptDTO script = scriptService.getScriptById(scriptId);
        if (script == null) {
            return ResponseEntity.notFound().build();
        }
        
        TestReportDTO report = testService.generateReport(script);
        return ResponseEntity.ok(report);
    }

    private TestStateDTO extractState(Map<String, Object> request) {
        TestStateDTO state = new TestStateDTO();
        Map<String, Object> stateMap = (Map<String, Object>) request.get("state");
        
        if (stateMap != null) {
            if (stateMap.get("scriptId") != null) {
                state.setScriptId(Long.valueOf(stateMap.get("scriptId").toString()));
            }
            if (stateMap.get("currentSceneId") != null) {
                state.setCurrentSceneId(Long.valueOf(stateMap.get("currentSceneId").toString()));
            }
            if (stateMap.get("currentSceneIndex") != null) {
                state.setCurrentSceneIndex(Integer.valueOf(stateMap.get("currentSceneIndex").toString()));
            }
            if (stateMap.get("currentPuzzleId") != null) {
                state.setCurrentPuzzleId(Long.valueOf(stateMap.get("currentPuzzleId").toString()));
            }
            if (stateMap.get("currentPuzzleIndex") != null) {
                state.setCurrentPuzzleIndex(Integer.valueOf(stateMap.get("currentPuzzleIndex").toString()));
            }
            if (stateMap.get("solvedPuzzles") != null) {
                state.setSolvedPuzzles(Integer.valueOf(stateMap.get("solvedPuzzles").toString()));
            }
            if (stateMap.get("completedScenes") != null) {
                state.setCompletedScenes(Integer.valueOf(stateMap.get("completedScenes").toString()));
            }
            if (stateMap.get("finished") != null) {
                state.setFinished(Boolean.valueOf(stateMap.get("finished").toString()));
            }
        }
        
        return state;
    }
}
