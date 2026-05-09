package com.logistics.track.dto;

import lombok.Data;

@Data
public class SankeyLinkDTO {
    private Integer source;
    private Integer target;
    private Long value;
    private String sourceName;
    private String targetName;
}
