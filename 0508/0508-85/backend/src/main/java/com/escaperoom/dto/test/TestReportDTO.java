package com.escaperoom.dto.test;

import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Data
public class TestReportDTO {
    private Long scriptId;
    private String scriptName;
    private Long startTime;
    private Long endTime;
    private Long duration;
    private Boolean passed;
    private Integer totalScenes;
    private Integer completedScenes;
    private Integer totalPuzzles;
    private Integer solvedPuzzles;
    private List<SceneTestResultDTO> sceneResults = new ArrayList<>();
    private List<String> overallIssues = new ArrayList<>();
    private List<String> suggestions = new ArrayList<>();
}
