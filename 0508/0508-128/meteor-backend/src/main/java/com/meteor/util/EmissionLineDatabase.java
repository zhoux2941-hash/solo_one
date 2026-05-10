package com.meteor.util;

import java.util.HashMap;
import java.util.Map;

public class EmissionLineDatabase {
    
    public static final Map<String, Double> COMMON_LINES = new HashMap<>();
    
    static {
        COMMON_LINES.put("Na I 5890", 5890.0);
        COMMON_LINES.put("Na I 5896", 5896.0);
        COMMON_LINES.put("Mg I 5184", 5184.0);
        COMMON_LINES.put("Mg I 5173", 5173.0);
        COMMON_LINES.put("Mg I 5167", 5167.0);
        COMMON_LINES.put("Fe I 5167", 5167.0);
        COMMON_LINES.put("Fe I 5270", 5270.0);
        COMMON_LINES.put("Fe I 5328", 5328.0);
        COMMON_LINES.put("Ca I 4227", 4227.0);
        COMMON_LINES.put("Ca II H", 3968.0);
        COMMON_LINES.put("Ca II K", 3934.0);
        COMMON_LINES.put("H-alpha", 6563.0);
        COMMON_LINES.put("H-beta", 4861.0);
        COMMON_LINES.put("H-gamma", 4340.0);
        COMMON_LINES.put("O I 7774", 7774.0);
        COMMON_LINES.put("O I 8446", 8446.0);
        COMMON_LINES.put("N I 7442", 7442.0);
        COMMON_LINES.put("Si I 3906", 3906.0);
        COMMON_LINES.put("Si I 4103", 4103.0);
    }
    
    public static String getElementName(String lineName) {
        if (lineName.startsWith("Na")) return "Na";
        if (lineName.startsWith("Mg")) return "Mg";
        if (lineName.startsWith("Fe")) return "Fe";
        if (lineName.startsWith("Ca")) return "Ca";
        if (lineName.startsWith("H")) return "H";
        if (lineName.startsWith("O")) return "O";
        if (lineName.startsWith("N")) return "N";
        if (lineName.startsWith("Si")) return "Si";
        return lineName.split(" ")[0];
    }
}
