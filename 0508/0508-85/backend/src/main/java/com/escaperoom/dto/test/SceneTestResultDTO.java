package com.escaperoom.dto.test;

import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Data
public class SceneTestResultDTO {
    private Long sceneId;
    private String sceneName;
    private Integer orderIndex;
    private Boolean passed;
    private List<PuzzleTestResultDTO> puzzleResults = new ArrayList<>();
    private String unlockCondition;
    private Boolean canUnlockNext;
    private List<String> issues = new ArrayList<>();
    private List<String> suggestions = new ArrayList<>();
}
