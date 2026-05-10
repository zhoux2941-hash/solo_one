package com.escaperoom.dto.test;

import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Data
public class PuzzleTestResultDTO {
    private Long puzzleId;
    private String puzzleName;
    private Integer orderIndex;
    private String puzzleText;
    private String answer;
    private String unlockCondition;
    private Boolean passed;
    private List<String> issues = new ArrayList<>();
    private List<String> suggestions = new ArrayList<>();
}
