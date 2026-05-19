package com.graphdb.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EdgeDTO {

    private Long id;
    private Long fromVertexId;
    private Long toVertexId;
    private String label;
    private Double weight = 1.0;
    private Map<String, Object> properties = new HashMap<>();
}