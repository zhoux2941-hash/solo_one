package com.escaperoom.service;

import com.escaperoom.dto.PuzzleDTO;
import com.escaperoom.dto.SceneDTO;
import com.escaperoom.dto.ScriptDTO;
import com.escaperoom.entity.Puzzle;
import com.escaperoom.entity.Scene;
import com.escaperoom.entity.Script;
import com.escaperoom.exception.ConcurrentEditException;
import com.escaperoom.repository.PuzzleRepository;
import com.escaperoom.repository.SceneRepository;
import com.escaperoom.repository.ScriptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Transactional
public class ScriptService {
    private static final String SCENE_LOCK_PREFIX = "scene:lock:";
    private static final String PUZZLE_LOCK_PREFIX = "puzzle:lock:";
    private static final String PUZZLE_EDITING_PREFIX = "puzzle:editing:";
    private static final long LOCK_TIMEOUT = 30;
    private static final long EDITING_TIMEOUT = 5;

    @Autowired
    private ScriptRepository scriptRepository;

    @Autowired
    private SceneRepository sceneRepository;

    @Autowired
    private PuzzleRepository puzzleRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public ScriptDTO createScript(ScriptDTO dto) {
        Script script = new Script();
        script.setName(dto.getName());
        script.setBackgroundStory(dto.getBackgroundStory());
        script.setDifficulty(dto.getDifficulty());
        Script saved = scriptRepository.save(script);
        return toScriptDTO(saved);
    }

    public ScriptDTO updateScript(Long id, ScriptDTO dto) {
        Script script = scriptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("剧本不存在"));
        script.setName(dto.getName());
        script.setBackgroundStory(dto.getBackgroundStory());
        script.setDifficulty(dto.getDifficulty());
        Script saved = scriptRepository.save(script);
        broadcastScriptUpdate(saved);
        return toScriptDTO(saved);
    }

    public List<ScriptDTO> getAllScripts() {
        return scriptRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(this::toScriptDTO)
                .collect(Collectors.toList());
    }

    public ScriptDTO getScriptById(Long id) {
        Script script = scriptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("剧本不存在"));
        return toScriptDTO(script);
    }

    public void deleteScript(Long id) {
        scriptRepository.deleteById(id);
    }

    public SceneDTO addScene(Long scriptId, SceneDTO dto) {
        Script script = scriptRepository.findById(scriptId)
                .orElseThrow(() -> new RuntimeException("剧本不存在"));
        
        int nextIndex = sceneRepository.findByScriptIdOrderByOrderIndexAsc(scriptId).size();
        
        Scene scene = new Scene();
        scene.setName(dto.getName());
        scene.setDescription(dto.getDescription());
        scene.setImageUrl(dto.getImageUrl());
        scene.setOrderIndex(nextIndex);
        scene.setScript(script);
        Scene saved = sceneRepository.save(scene);
        broadcastSceneUpdate(scriptId, saved);
        return toSceneDTO(saved);
    }

    public SceneDTO updateScene(Long sceneId, SceneDTO dto) {
        Scene scene = sceneRepository.findById(sceneId)
                .orElseThrow(() -> new RuntimeException("场景不存在"));
        
        String lockKey = SCENE_LOCK_PREFIX + sceneId;
        Boolean locked = redisTemplate.opsForValue().setIfAbsent(lockKey, dto.getName(), LOCK_TIMEOUT, TimeUnit.SECONDS);
        
        if (Boolean.FALSE.equals(locked)) {
            throw new ConcurrentEditException("场景正在被其他用户编辑，请稍后再试", "scene_locked", null);
        }
        
        try {
            scene.setName(dto.getName());
            scene.setDescription(dto.getDescription());
            scene.setImageUrl(dto.getImageUrl());
            if (dto.getOrderIndex() != null) {
                scene.setOrderIndex(dto.getOrderIndex());
            }
            Scene saved = sceneRepository.save(scene);
            broadcastSceneUpdate(scene.getScript().getId(), saved);
            return toSceneDTO(saved);
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    public void deleteScene(Long sceneId) {
        Scene scene = sceneRepository.findById(sceneId)
                .orElseThrow(() -> new RuntimeException("场景不存在"));
        Long scriptId = scene.getScript().getId();
        sceneRepository.deleteById(sceneId);
        messagingTemplate.convertAndSend("/topic/script/" + scriptId + "/scene/deleted", sceneId);
    }

    public PuzzleDTO addPuzzle(Long sceneId, PuzzleDTO dto) {
        Scene scene = sceneRepository.findById(sceneId)
                .orElseThrow(() -> new RuntimeException("场景不存在"));
        
        int nextIndex = puzzleRepository.findBySceneIdOrderByOrderIndexAsc(sceneId).size();
        
        Puzzle puzzle = new Puzzle();
        puzzle.setName(dto.getName());
        puzzle.setPuzzleText(dto.getPuzzleText());
        puzzle.setSolutionMethod(dto.getSolutionMethod());
        puzzle.setAnswer(dto.getAnswer());
        puzzle.setUnlockCondition(dto.getUnlockCondition());
        puzzle.setOrderIndex(nextIndex);
        puzzle.setScene(scene);
        Puzzle saved = puzzleRepository.save(puzzle);
        broadcastPuzzleUpdate(sceneId, saved);
        return toPuzzleDTO(saved);
    }

    public void startEditingPuzzle(Long puzzleId, String userId, String userName) {
        Puzzle puzzle = puzzleRepository.findById(puzzleId)
                .orElseThrow(() -> new RuntimeException("谜题不存在"));
        
        String editingKey = PUZZLE_EDITING_PREFIX + puzzleId;
        
        Map<String, Object> editorInfo = new HashMap<>();
        editorInfo.put("userId", userId);
        editorInfo.put("userName", userName);
        editorInfo.put("puzzleId", puzzleId);
        editorInfo.put("sceneId", puzzle.getScene().getId());
        editorInfo.put("timestamp", System.currentTimeMillis());
        
        Object currentEditor = redisTemplate.opsForValue().get(editingKey);
        if (currentEditor != null) {
            Map<String, Object> currentMap = (Map<String, Object>) currentEditor;
            if (!userId.equals(currentMap.get("userId"))) {
                throw new ConcurrentEditException(
                    "谜题正在被用户 \"" + currentMap.get("userName") + "\" 编辑", 
                    "puzzle_editing", 
                    currentEditor
                );
            }
        }
        
        redisTemplate.opsForValue().set(editingKey, editorInfo, EDITING_TIMEOUT, TimeUnit.SECONDS);
        
        broadcastPuzzleEditingStatus(puzzle.getScene().getId(), puzzleId, editorInfo, true);
    }

    public void stopEditingPuzzle(Long puzzleId, String userId) {
        Puzzle puzzle = puzzleRepository.findById(puzzleId)
                .orElse(null);
        
        if (puzzle == null) return;
        
        String editingKey = PUZZLE_EDITING_PREFIX + puzzleId;
        Object currentEditor = redisTemplate.opsForValue().get(editingKey);
        
        if (currentEditor != null) {
            Map<String, Object> currentMap = (Map<String, Object>) currentEditor;
            if (userId.equals(currentMap.get("userId"))) {
                redisTemplate.delete(editingKey);
                broadcastPuzzleEditingStatus(puzzle.getScene().getId(), puzzleId, null, false);
            }
        }
    }

    public Map<String, Object> getPuzzleEditingStatus(Long puzzleId) {
        String editingKey = PUZZLE_EDITING_PREFIX + puzzleId;
        Object editorInfo = redisTemplate.opsForValue().get(editingKey);
        return editorInfo != null ? (Map<String, Object>) editorInfo : null;
    }

    public PuzzleDTO updatePuzzle(Long puzzleId, PuzzleDTO dto, String userId) {
        Puzzle puzzle = puzzleRepository.findById(puzzleId)
                .orElseThrow(() -> new RuntimeException("谜题不存在"));
        
        String lockKey = PUZZLE_LOCK_PREFIX + puzzleId;
        String editingKey = PUZZLE_EDITING_PREFIX + puzzleId;
        
        Boolean locked = redisTemplate.opsForValue().setIfAbsent(lockKey, userId, LOCK_TIMEOUT, TimeUnit.SECONDS);
        
        if (Boolean.FALSE.equals(locked)) {
            throw new ConcurrentEditException("谜题正在被其他用户编辑，请稍后再试", "puzzle_locked", null);
        }
        
        try {
            if (dto.getVersion() != null && !dto.getVersion().equals(puzzle.getVersion())) {
                PuzzleDTO currentDto = toPuzzleDTO(puzzle);
                throw new ConcurrentEditException(
                    "数据已过时，其他用户已修改此谜题", 
                    "version_conflict", 
                    currentDto
                );
            }
            
            puzzle.setName(dto.getName());
            puzzle.setPuzzleText(dto.getPuzzleText());
            puzzle.setSolutionMethod(dto.getSolutionMethod());
            puzzle.setAnswer(dto.getAnswer());
            puzzle.setUnlockCondition(dto.getUnlockCondition());
            if (dto.getOrderIndex() != null) {
                puzzle.setOrderIndex(dto.getOrderIndex());
            }
            
            Puzzle saved;
            try {
                saved = puzzleRepository.save(puzzle);
            } catch (ObjectOptimisticLockingFailureException e) {
                puzzle = puzzleRepository.findById(puzzleId)
                        .orElseThrow(() -> new RuntimeException("谜题不存在"));
                PuzzleDTO currentDto = toPuzzleDTO(puzzle);
                throw new ConcurrentEditException(
                    "数据已过时，其他用户已修改此谜题", 
                    "version_conflict", 
                    currentDto
                );
            }
            
            redisTemplate.delete(editingKey);
            broadcastPuzzleEditingStatus(saved.getScene().getId(), puzzleId, null, false);
            broadcastPuzzleUpdate(saved.getScene().getId(), saved);
            
            return toPuzzleDTO(saved);
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    public PuzzleDTO forceUpdatePuzzle(Long puzzleId, PuzzleDTO dto, String userId) {
        Puzzle puzzle = puzzleRepository.findById(puzzleId)
                .orElseThrow(() -> new RuntimeException("谜题不存在"));
        
        puzzle.setName(dto.getName());
        puzzle.setPuzzleText(dto.getPuzzleText());
        puzzle.setSolutionMethod(dto.getSolutionMethod());
        puzzle.setAnswer(dto.getAnswer());
        puzzle.setUnlockCondition(dto.getUnlockCondition());
        if (dto.getOrderIndex() != null) {
            puzzle.setOrderIndex(dto.getOrderIndex());
        }
        
        Puzzle saved = puzzleRepository.save(puzzle);
        
        String editingKey = PUZZLE_EDITING_PREFIX + puzzleId;
        redisTemplate.delete(editingKey);
        broadcastPuzzleEditingStatus(saved.getScene().getId(), puzzleId, null, false);
        broadcastPuzzleUpdate(saved.getScene().getId(), saved);
        
        return toPuzzleDTO(saved);
    }

    public void deletePuzzle(Long puzzleId) {
        Puzzle puzzle = puzzleRepository.findById(puzzleId)
                .orElseThrow(() -> new RuntimeException("谜题不存在"));
        Long sceneId = puzzle.getScene().getId();
        puzzleRepository.deleteById(puzzleId);
        
        String lockKey = PUZZLE_LOCK_PREFIX + puzzleId;
        String editingKey = PUZZLE_EDITING_PREFIX + puzzleId;
        redisTemplate.delete(lockKey);
        redisTemplate.delete(editingKey);
        
        messagingTemplate.convertAndSend("/topic/scene/" + sceneId + "/puzzle/deleted", puzzleId);
    }

    private void broadcastScriptUpdate(Script script) {
        messagingTemplate.convertAndSend("/topic/script/" + script.getId() + "/updated", toScriptDTO(script));
    }

    private void broadcastSceneUpdate(Long scriptId, Scene scene) {
        messagingTemplate.convertAndSend("/topic/script/" + scriptId + "/scene/updated", toSceneDTO(scene));
    }

    private void broadcastPuzzleUpdate(Long sceneId, Puzzle puzzle) {
        messagingTemplate.convertAndSend("/topic/scene/" + sceneId + "/puzzle/updated", toPuzzleDTO(puzzle));
    }

    private void broadcastPuzzleEditingStatus(Long sceneId, Long puzzleId, Map<String, Object> editorInfo, boolean isEditing) {
        Map<String, Object> message = new HashMap<>();
        message.put("puzzleId", puzzleId);
        message.put("isEditing", isEditing);
        message.put("editorInfo", editorInfo);
        
        messagingTemplate.convertAndSend("/topic/scene/" + sceneId + "/puzzle/editing", message);
    }

    private ScriptDTO toScriptDTO(Script script) {
        ScriptDTO dto = new ScriptDTO();
        dto.setId(script.getId());
        dto.setName(script.getName());
        dto.setBackgroundStory(script.getBackgroundStory());
        dto.setDifficulty(script.getDifficulty());
        if (script.getScenes() != null) {
            dto.setScenes(script.getScenes().stream()
                    .map(this::toSceneDTO)
                    .collect(Collectors.toList()));
        } else {
            dto.setScenes(new ArrayList<>());
        }
        return dto;
    }

    private SceneDTO toSceneDTO(Scene scene) {
        SceneDTO dto = new SceneDTO();
        dto.setId(scene.getId());
        dto.setName(scene.getName());
        dto.setDescription(scene.getDescription());
        dto.setImageUrl(scene.getImageUrl());
        dto.setOrderIndex(scene.getOrderIndex());
        dto.setScriptId(scene.getScript().getId());
        if (scene.getPuzzles() != null) {
            dto.setPuzzles(scene.getPuzzles().stream()
                    .map(this::toPuzzleDTO)
                    .collect(Collectors.toList()));
        } else {
            dto.setPuzzles(new ArrayList<>());
        }
        return dto;
    }

    private PuzzleDTO toPuzzleDTO(Puzzle puzzle) {
        PuzzleDTO dto = new PuzzleDTO();
        dto.setId(puzzle.getId());
        dto.setName(puzzle.getName());
        dto.setPuzzleText(puzzle.getPuzzleText());
        dto.setSolutionMethod(puzzle.getSolutionMethod());
        dto.setAnswer(puzzle.getAnswer());
        dto.setUnlockCondition(puzzle.getUnlockCondition());
        dto.setOrderIndex(puzzle.getOrderIndex());
        dto.setVersion(puzzle.getVersion());
        dto.setSceneId(puzzle.getScene().getId());
        return dto;
    }
}
