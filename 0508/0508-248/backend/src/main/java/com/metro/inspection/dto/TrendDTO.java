package com.metro.inspection.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class TrendDTO {
    private List<String> months;
    private List<Integer> historical;
    private List<Integer> predicted;
}
