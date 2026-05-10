package com.construction.progress.constant;

import java.util.Arrays;
import java.util.List;

public class ProgressConstants {
    public static final List<String> STAGES = Arrays.asList(
        "地基",
        "框架",
        "砌墙",
        "封顶",
        "装修"
    );
    
    public static final int TOTAL_STAGES = STAGES.size();
    
    public static final String getStageName(int index) {
        if (index >= 0 && index < STAGES.size()) {
            return STAGES.get(index);
        }
        return "未知工序";
    }
    
    public static final String REDIS_KEY_PROJECT_STATUS = "project:status:";
    public static final String REDIS_KEY_PROJECT_PROGRESS = "project:progress:";
    public static final String REDIS_KEY_CHECKIN_TIMELINE = "project:timeline:";
    
    public static final long REDIS_EXPIRE_SECONDS = 3600;
}
