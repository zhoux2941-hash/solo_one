package com.escaperoom.dto.test;

import lombok.Data;

@Data
public class TestStateDTO {
    private Long scriptId;
    private Long currentSceneId;
    private Integer currentSceneIndex;
    private Long currentPuzzleId;
    private Integer currentPuzzleIndex;
    private Integer solvedPuzzles;
    private Integer completedScenes;
    private Boolean finished;
}
