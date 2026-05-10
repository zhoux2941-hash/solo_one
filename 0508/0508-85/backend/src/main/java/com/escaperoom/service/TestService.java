package com.escaperoom.service;

import com.escaperoom.dto.PuzzleDTO;
import com.escaperoom.dto.SceneDTO;
import com.escaperoom.dto.ScriptDTO;
import com.escaperoom.dto.test.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TestService {

    public TestStateDTO startTest(ScriptDTO script) {
        TestStateDTO state = new TestStateDTO();
        state.setScriptId(script.getId());
        state.setCurrentSceneIndex(0);
        state.setCurrentPuzzleIndex(0);
        state.setSolvedPuzzles(0);
        state.setCompletedScenes(0);
        state.setFinished(false);
        
        if (script.getScenes() != null && !script.getScenes().isEmpty()) {
            SceneDTO firstScene = script.getScenes().get(0);
            state.setCurrentSceneId(firstScene.getId());
            if (firstScene.getPuzzles() != null && !firstScene.getPuzzles().isEmpty()) {
                state.setCurrentPuzzleId(firstScene.getPuzzles().get(0).getId());
            }
        }
        
        return state;
    }

    public boolean checkAnswer(PuzzleDTO puzzle, String answer) {
        if (puzzle == null || puzzle.getAnswer() == null || answer == null) {
            return false;
        }
        
        String correctAnswer = puzzle.getAnswer().trim().toLowerCase();
        String userAnswer = answer.trim().toLowerCase();
        
        if (correctAnswer.equals(userAnswer)) {
            return true;
        }
        
        String[] answers = correctAnswer.split("[,，|/；;]");
        for (String ans : answers) {
            if (ans.trim().toLowerCase().equals(userAnswer)) {
                return true;
            }
        }
        
        return false;
    }

    public TestStateDTO solvePuzzle(TestStateDTO state, ScriptDTO script, Long puzzleId) {
        SceneDTO currentScene = findSceneById(script, state.getCurrentSceneId());
        if (currentScene == null) return state;
        
        List<PuzzleDTO> puzzles = currentScene.getPuzzles();
        if (puzzles == null || puzzles.isEmpty()) {
            return tryNextScene(state, script, currentScene);
        }
        
        int puzzleIndex = -1;
        for (int i = 0; i < puzzles.size(); i++) {
            if (puzzles.get(i).getId().equals(puzzleId)) {
                puzzleIndex = i;
                break;
            }
        }
        
        if (puzzleIndex < 0) return state;
        
        state.setSolvedPuzzles(state.getSolvedPuzzles() + 1);
        
        if (puzzleIndex < puzzles.size() - 1) {
            state.setCurrentPuzzleIndex(puzzleIndex + 1);
            state.setCurrentPuzzleId(puzzles.get(puzzleIndex + 1).getId());
        } else {
            return tryNextScene(state, script, currentScene);
        }
        
        return state;
    }

    private TestStateDTO tryNextScene(TestStateDTO state, ScriptDTO script, SceneDTO currentScene) {
        List<SceneDTO> scenes = script.getScenes();
        if (scenes == null) return state;
        
        int currentSceneIndex = -1;
        for (int i = 0; i < scenes.size(); i++) {
            if (scenes.get(i).getId().equals(currentScene.getId())) {
                currentSceneIndex = i;
                break;
            }
        }
        
        state.setCompletedScenes(state.getCompletedScenes() + 1);
        
        if (currentSceneIndex < scenes.size() - 1) {
            SceneDTO nextScene = scenes.get(currentSceneIndex + 1);
            state.setCurrentSceneId(nextScene.getId());
            state.setCurrentSceneIndex(currentSceneIndex + 1);
            if (nextScene.getPuzzles() != null && !nextScene.getPuzzles().isEmpty()) {
                state.setCurrentPuzzleIndex(0);
                state.setCurrentPuzzleId(nextScene.getPuzzles().get(0).getId());
            } else {
                state.setCurrentPuzzleIndex(0);
                state.setCurrentPuzzleId(null);
            }
        } else {
            state.setFinished(true);
        }
        
        return state;
    }

    private SceneDTO findSceneById(ScriptDTO script, Long sceneId) {
        if (script == null || script.getScenes() == null || sceneId == null) return null;
        for (SceneDTO scene : script.getScenes()) {
            if (sceneId.equals(scene.getId())) {
                return scene;
            }
        }
        return null;
    }

    public PuzzleDTO getCurrentPuzzle(TestStateDTO state, ScriptDTO script) {
        SceneDTO scene = findSceneById(script, state.getCurrentSceneId());
        if (scene == null || scene.getPuzzles() == null) return null;
        
        for (PuzzleDTO puzzle : scene.getPuzzles()) {
            if (puzzle.getId().equals(state.getCurrentPuzzleId())) {
                return puzzle;
            }
        }
        
        if (!scene.getPuzzles().isEmpty() && state.getCurrentPuzzleIndex() < scene.getPuzzles().size()) {
            return scene.getPuzzles().get(state.getCurrentPuzzleIndex());
        }
        
        return null;
    }

    public TestReportDTO generateReport(ScriptDTO script) {
        TestReportDTO report = new TestReportDTO();
        report.setStartTime(System.currentTimeMillis());
        report.setScriptId(script.getId());
        report.setScriptName(script.getName());
        
        List<SceneDTO> scenes = script.getScenes();
        report.setTotalScenes(scenes != null ? scenes.size() : 0);
        
        int totalPuzzles = 0;
        if (scenes != null) {
            for (SceneDTO scene : scenes) {
                if (scene.getPuzzles() != null) {
                    totalPuzzles += scene.getPuzzles().size();
                }
            }
        }
        report.setTotalPuzzles(totalPuzzles);
        
        List<SceneTestResultDTO> sceneResults = new ArrayList<>();
        boolean allPassed = true;
        int completedScenes = 0;
        int solvedPuzzles = 0;
        
        if (scenes != null) {
            for (int i = 0; i < scenes.size(); i++) {
                SceneDTO scene = scenes.get(i);
                SceneTestResultDTO sceneResult = analyzeScene(scene, i, scenes.size());
                sceneResults.add(sceneResult);
                
                if (sceneResult.getPassed()) {
                    completedScenes++;
                }
                if (sceneResult.getPuzzleResults() != null) {
                    for (PuzzleTestResultDTO puzzleResult : sceneResult.getPuzzleResults()) {
                        if (puzzleResult.getPassed()) {
                            solvedPuzzles++;
                        }
                    }
                }
                
                if (!sceneResult.getPassed()) {
                    allPassed = false;
                }
            }
        }
        
        report.setSceneResults(sceneResults);
        report.setCompletedScenes(completedScenes);
        report.setSolvedPuzzles(solvedPuzzles);
        report.setPassed(allPassed);
        report.setEndTime(System.currentTimeMillis());
        report.setDuration(report.getEndTime() - report.getStartTime());
        
        generateOverallReport(report, script);
        
        return report;
    }

    private SceneTestResultDTO analyzeScene(SceneDTO scene, int index, int totalScenes) {
        SceneTestResultDTO result = new SceneTestResultDTO();
        result.setSceneId(scene.getId());
        result.setSceneName(scene.getName());
        result.setOrderIndex(index);
        result.setUnlockCondition(scene.getDescription());
        
        List<PuzzleDTO> puzzles = scene.getPuzzles();
        boolean scenePassed = true;
        
        List<String> sceneIssues = new ArrayList<>();
        List<String> sceneSuggestions = new ArrayList<>();
        
        if (scene.getName() == null || scene.getName().trim().isEmpty()) {
            sceneIssues.add("场景名称为空");
            scenePassed = false;
        }
        
        if (scene.getDescription() == null || scene.getDescription().trim().isEmpty()) {
            sceneIssues.add("场景描述为空，建议添加详细的场景描述来营造氛围");
            sceneSuggestions.add("添加场景描述，包括环境氛围、灯光、音效等");
        }
        
        if (puzzles == null || puzzles.isEmpty()) {
            if (index < totalScenes - 1) {
                sceneIssues.add("场景没有谜题，但不是最后一个场景，玩家无法通过解开谜题进入下一个场景");
                scenePassed = false;
            } else {
                sceneSuggestions.add("最后一个场景可以没有谜题，作为通关场景");
            }
        }
        
        List<PuzzleTestResultDTO> puzzleResults = new ArrayList<>();
        if (puzzles != null) {
            for (int i = 0; i < puzzles.size(); i++) {
                PuzzleDTO puzzle = puzzles.get(i);
                PuzzleTestResultDTO puzzleResult = analyzePuzzle(puzzle, i, puzzles.size(), index, totalScenes);
                puzzleResults.add(puzzleResult);
                
                if (!puzzleResult.getPassed()) {
                    scenePassed = false;
                }
            }
        }
        
        result.setPuzzleResults(puzzleResults);
        result.setPassed(scenePassed);
        result.setIssues(sceneIssues);
        result.setSuggestions(sceneSuggestions);
        
        result.setCanUnlockNext(scenePassed && (index == totalScenes - 1 || hasUnlockCondition(puzzles)));
        
        return result;
    }

    private boolean hasUnlockCondition(List<PuzzleDTO> puzzles) {
        if (puzzles == null || puzzles.isEmpty()) return false;
        for (PuzzleDTO puzzle : puzzles) {
            if (puzzle.getUnlockCondition() != null && !puzzle.getUnlockCondition().trim().isEmpty()) {
                return true;
            }
        }
        return false;
    }

    private PuzzleTestResultDTO analyzePuzzle(PuzzleDTO puzzle, int index, int totalPuzzles, 
                                               int sceneIndex, int totalScenes) {
        PuzzleTestResultDTO result = new PuzzleTestResultDTO();
        result.setPuzzleId(puzzle.getId());
        result.setPuzzleName(puzzle.getName());
        result.setOrderIndex(index);
        result.setPuzzleText(puzzle.getPuzzleText());
        result.setAnswer(puzzle.getAnswer());
        result.setUnlockCondition(puzzle.getUnlockCondition());
        
        List<String> issues = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();
        boolean passed = true;
        
        if (puzzle.getName() == null || puzzle.getName().trim().isEmpty()) {
            issues.add("谜题名称为空");
            passed = false;
        }
        
        if (puzzle.getPuzzleText() == null || puzzle.getPuzzleText().trim().isEmpty()) {
            issues.add("谜面为空");
            passed = false;
        } else if (puzzle.getPuzzleText().length() < 10) {
            suggestions.add("谜面可能过于简单，建议增加更多线索和细节");
        }
        
        if (puzzle.getAnswer() == null || puzzle.getAnswer().trim().isEmpty()) {
            issues.add("答案为空，玩家无法通过此谜题");
            passed = false;
        }
        
        if (puzzle.getSolutionMethod() == null || puzzle.getSolutionMethod().trim().isEmpty()) {
            issues.add("解谜方式为空，建议记录解谜思路");
            suggestions.add("添加详细的解谜方式描述，包括：如何发现线索、推理过程、答案来源");
        }
        
        if (index == totalPuzzles - 1 && sceneIndex < totalScenes - 1) {
            if (puzzle.getUnlockCondition() == null || puzzle.getUnlockCondition().trim().isEmpty()) {
                issues.add("这是该场景的最后一个谜题，但缺少解锁下一个场景的条件描述");
                suggestions.add("添加解锁条件，例如：\"解开此谜题后，发现隐藏的钥匙，可打开通往书房的门\"");
            }
        }
        
        if (puzzle.getUnlockCondition() != null && !puzzle.getUnlockCondition().trim().isEmpty()) {
            if (index < totalPuzzles - 1) {
                suggestions.add("解锁条件通常应放在场景的最后一个谜题上，当前谜题不是该场景的最后一个");
            }
        }
        
        result.setIssues(issues);
        result.setSuggestions(suggestions);
        result.setPassed(passed);
        
        return result;
    }

    private void generateOverallReport(TestReportDTO report, ScriptDTO script) {
        List<String> overallIssues = new ArrayList<>();
        List<String> overallSuggestions = new ArrayList<>();
        
        if (script.getName() == null || script.getName().trim().isEmpty()) {
            overallIssues.add("剧本名称为空");
        }
        
        if (script.getDifficulty() == null || script.getDifficulty().trim().isEmpty()) {
            overallIssues.add("剧本难度未设置");
        }
        
        if (script.getBackgroundStory() == null || script.getBackgroundStory().trim().isEmpty()) {
            overallIssues.add("背景故事为空，建议添加引人入胜的背景故事");
            overallSuggestions.add("编写详细的背景故事，包括：时间背景、地点、人物关系、事件起因等");
        }
        
        List<SceneDTO> scenes = script.getScenes();
        if (scenes == null || scenes.isEmpty()) {
            overallIssues.add("剧本没有场景，玩家无法开始游戏");
        } else {
            boolean hasEndingScene = false;
            for (int i = 0; i < scenes.size(); i++) {
                SceneDTO scene = scenes.get(i);
                List<PuzzleDTO> puzzles = scene.getPuzzles();
                
                if ((puzzles == null || puzzles.isEmpty()) && i == scenes.size() - 1) {
                    hasEndingScene = true;
                }
            }
            
            if (!hasEndingScene) {
                overallSuggestions.add("建议最后一个场景设计为通关场景（没有谜题），用于展示结局和故事收尾");
            }
            
            if (scenes.size() < 2) {
                overallSuggestions.add("建议增加更多场景来丰富游戏体验，通常密室逃脱有3-5个场景");
            }
            
            int puzzleCount = 0;
            for (SceneDTO scene : scenes) {
                if (scene.getPuzzles() != null) {
                    puzzleCount += scene.getPuzzles().size();
                }
            }
            
            if (puzzleCount < 3) {
                overallSuggestions.add("谜题数量较少，建议增加更多谜题来增加游戏时长和挑战性");
            }
        }
        
        if (report.getSolvedPuzzles() != null && report.getTotalPuzzles() != null && report.getTotalPuzzles() > 0) {
            double passRate = (double) report.getSolvedPuzzles() / report.getTotalPuzzles() * 100;
            if (passRate < 100) {
                overallIssues.add(String.format("谜题通过率: %.1f%%，有 %d 个谜题存在问题需要修复", 
                    passRate, report.getTotalPuzzles() - report.getSolvedPuzzles()));
            }
        }
        
        if (report.getCompletedScenes() != null && report.getTotalScenes() != null && report.getTotalScenes() > 0) {
            double scenePassRate = (double) report.getCompletedScenes() / report.getTotalScenes() * 100;
            if (scenePassRate < 100) {
                overallIssues.add(String.format("场景通过率: %.1f%%，有 %d 个场景存在问题需要修复", 
                    scenePassRate, report.getTotalScenes() - report.getCompletedScenes()));
            }
        }
        
        report.setOverallIssues(overallIssues);
        report.setSuggestions(overallSuggestions);
    }
}
