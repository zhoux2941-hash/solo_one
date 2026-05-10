package com.biolab.pipette.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ReagentType {
    SAMPLE_A("SAMPLE_A", "样本A"),
    SAMPLE_B("SAMPLE_B", "样本B"),
    SAMPLE_C("SAMPLE_C", "样本C"),
    BUFFER("BUFFER", "缓冲液"),
    WASTE("WASTE", "废液"),
    EMPTY("EMPTY", "空孔");

    private final String code;
    private final String displayName;

    ReagentType(String code, String displayName) {
        this.code = code;
        this.displayName = displayName;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static ReagentType fromCode(String code) {
        for (ReagentType type : values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        return EMPTY;
    }
}