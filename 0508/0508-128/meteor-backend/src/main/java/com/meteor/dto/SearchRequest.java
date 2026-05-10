package com.meteor.dto;

import lombok.Data;

@Data
public class SearchRequest {
    private String element;
    private Double minVelocity;
    private Double maxVelocity;
    private String uploaderName;
    private Integer page = 0;
    private Integer size = 20;
}
