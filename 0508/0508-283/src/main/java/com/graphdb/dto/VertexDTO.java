package com.graphdb.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VertexDTO {

    private Long id;
    private String label;
    private Map<String, Object> properties = new HashMap<>();
}