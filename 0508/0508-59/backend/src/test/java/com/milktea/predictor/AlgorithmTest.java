package com.milktea.predictor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AlgorithmTest {

    private static final Map<String, Double> TEA_BASE_BASE_SCORE = new HashMap<>();
    private static final Map<String, Double> TOPPING_BASE_SCORE = new HashMap<>();
    private static final Map<String, Double> TEA_TOPPING_SYNERGY = new HashMap<>();
    private static final Map<String, Double> TOPPING_COMBINATION_SCORE = new HashMap<>();
    private static final Map<String, Double> FULL_COMBINATION_SCORE = new HashMap<>();

    static {
        TEA_BASE_BASE_SCORE.put("红茶", 7.5);
        TEA_BASE_BASE_SCORE.put("绿茶", 7.0);
        TEA_BASE_BASE_SCORE.put("乌龙", 8.0);

        TOPPING_BASE_SCORE.put("珍珠", 8.5);
        TOPPING_BASE_SCORE.put("椰果", 7.0);
        TOPPING_BASE_SCORE.put("仙草", 7.5);
        TOPPING_BASE_SCORE.put("布丁", 8.0);
        TOPPING_BASE_SCORE.put("爆珠", 8.5);

        TEA_TOPPING_SYNERGY.put("红茶_珍珠", 1.0);
        TEA_TOPPING_SYNERGY.put("红茶_布丁", 0.8);
        TEA_TOPPING_SYNERGY.put("红茶_仙草", 1.2);
        TEA_TOPPING_SYNERGY.put("红茶_椰果", 0.5);
        TEA_TOPPING_SYNERGY.put("红茶_爆珠", 0.6);
        TEA_TOPPING_SYNERGY.put("绿茶_椰果", 1.2);
        TEA_TOPPING_SYNERGY.put("绿茶_爆珠", 0.8);
        TEA_TOPPING_SYNERGY.put("绿茶_珍珠", 0.6);
        TEA_TOPPING_SYNERGY.put("绿茶_仙草", 0.7);
        TEA_TOPPING_SYNERGY.put("绿茶_布丁", 0.5);
        TEA_TOPPING_SYNERGY.put("乌龙_珍珠", 0.5);
        TEA_TOPPING_SYNERGY.put("乌龙_布丁", 1.0);
        TEA_TOPPING_SYNERGY.put("乌龙_仙草", 0.8);
        TEA_TOPPING_SYNERGY.put("乌龙_椰果", 0.6);
        TEA_TOPPING_SYNERGY.put("乌龙_爆珠", 0.5);

        TOPPING_COMBINATION_SCORE.put("珍珠_布丁", 1.5);
        TOPPING_COMBINATION_SCORE.put("仙草_珍珠", 1.8);
        TOPPING_COMBINATION_SCORE.put("椰果_爆珠", 1.0);
        TOPPING_COMBINATION_SCORE.put("仙草_布丁", 1.2);
        TOPPING_COMBINATION_SCORE.put("珍珠_爆珠", 0.8);
        TOPPING_COMBINATION_SCORE.put("仙草_椰果", 0.9);
        TOPPING_COMBINATION_SCORE.put("布丁_爆珠", 0.7);
        TOPPING_COMBINATION_SCORE.put("珍珠_椰果", 0.6);

        FULL_COMBINATION_SCORE.put("红茶:珍珠", 9.2);
        FULL_COMBINATION_SCORE.put("红茶:仙草", 8.5);
        FULL_COMBINATION_SCORE.put("红茶:布丁", 8.7);
        FULL_COMBINATION_SCORE.put("红茶:珍珠,仙草", 9.5);
        FULL_COMBINATION_SCORE.put("红茶:珍珠,布丁", 9.3);
        FULL_COMBINATION_SCORE.put("红茶:仙草,布丁", 8.8);
        FULL_COMBINATION_SCORE.put("红茶:珍珠,仙草,布丁", 8.6);
        FULL_COMBINATION_SCORE.put("绿茶:椰果", 8.5);
        FULL_COMBINATION_SCORE.put("绿茶:爆珠", 8.2);
        FULL_COMBINATION_SCORE.put("绿茶:椰果,爆珠", 9.0);
        FULL_COMBINATION_SCORE.put("乌龙:珍珠", 8.5);
        FULL_COMBINATION_SCORE.put("乌龙:布丁", 9.0);
        FULL_COMBINATION_SCORE.put("乌龙:仙草", 8.7);
        FULL_COMBINATION_SCORE.put("乌龙:珍珠,布丁", 9.5);
        FULL_COMBINATION_SCORE.put("乌龙:仙草,布丁", 8.8);
        FULL_COMBINATION_SCORE.put("乌龙:珍珠,仙草", 8.5);
    }

    public static void main(String[] args) {
        System.out.println("========================================");
        System.out.println("奶茶评分算法测试 - 修复后版本");
        System.out.println("========================================");

        testCase("红茶 + 珍珠", "红茶", Arrays.asList("珍珠"));
        testCase("红茶 + 珍珠 + 仙草", "红茶", Arrays.asList("珍珠", "仙草"));
        testCase("红茶 + 珍珠 + 布丁", "红茶", Arrays.asList("珍珠", "布丁"));
        testCase("乌龙 + 珍珠 + 布丁", "乌龙", Arrays.asList("珍珠", "布丁"));
        testCase("绿茶 + 椰果 + 爆珠", "绿茶", Arrays.asList("椰果", "爆珠"));
        testCase("红茶(无小料)", "红茶", Arrays.asList());
        testCase("红茶 + 布丁 + 爆珠(未命中)", "红茶", Arrays.asList("布丁", "爆珠"));
        testCase("红茶 + 珍珠 + 仙草 + 布丁", "红茶", Arrays.asList("珍珠", "仙草", "布丁"));

        System.out.println("\n========================================");
        System.out.println("测试完成");
        System.out.println("========================================");
    }

    private static void testCase(String caseName, String teaBase, List<String> toppings) {
        BigDecimal rating = calculateRating(teaBase, toppings);
        String comboKey = generateComboKey(teaBase, toppings);
        boolean isHit = FULL_COMBINATION_SCORE.containsKey(comboKey);

        System.out.println("\n【" + caseName + "】");
        System.out.println("  组合键: " + comboKey);
        System.out.println("  命中完整组合: " + (isHit ? "是 ✓" : "否 (多维度计算)"));
        System.out.println("  预测评分: " + rating);
        System.out.println("  评价: " + getRatingDescription(rating));
    }

    private static BigDecimal calculateRating(String teaBase, List<String> toppings) {
        String comboKey = generateComboKey(teaBase, toppings);

        Double fullScore = FULL_COMBINATION_SCORE.get(comboKey);
        if (fullScore != null) {
            return BigDecimal.valueOf(fullScore).setScale(1, java.math.RoundingMode.HALF_UP);
        }

        double baseScore = TEA_BASE_BASE_SCORE.getOrDefault(teaBase, 6.0);
        double score = baseScore;

        if (!toppings.isEmpty()) {
            double toppingTotal = 0;
            for (String topping : toppings) {
                toppingTotal += TOPPING_BASE_SCORE.getOrDefault(topping, 6.0);
            }
            double avgToppingScore = toppingTotal / toppings.size();
            score += (avgToppingScore - 7.0) * 0.25;
        }

        double teaToppingSynergy = 0;
        for (String topping : toppings) {
            String key = teaBase + "_" + topping;
            teaToppingSynergy += TEA_TOPPING_SYNERGY.getOrDefault(key, 0.0);
        }
        score += teaToppingSynergy;

        double toppingComboScore = 0;
        List<String> sortedToppings = new ArrayList<>(toppings);
        Collections.sort(sortedToppings);
        for (int i = 0; i < sortedToppings.size(); i++) {
            for (int j = i + 1; j < sortedToppings.size(); j++) {
                String pairKey = sortedToppings.get(i) + "_" + sortedToppings.get(j);
                toppingComboScore += TOPPING_COMBINATION_SCORE.getOrDefault(pairKey, 0.0);
            }
        }
        score += toppingComboScore;

        if (toppings.isEmpty()) {
            score -= 0.8;
        } else if (toppings.size() == 1) {
            score += 0.2;
        } else if (toppings.size() == 2) {
            score += 0.4;
        } else if (toppings.size() == 3) {
            score += 0.3;
        } else if (toppings.size() == 4) {
            score += 0.1;
        } else if (toppings.size() > 4) {
            score -= (toppings.size() - 4) * 0.4;
        }

        if (score < 1.0) score = 1.0;
        if (score > 10.0) score = 10.0;

        return BigDecimal.valueOf(score).setScale(1, java.math.RoundingMode.HALF_UP);
    }

    private static String generateComboKey(String teaBase, List<String> toppings) {
        List<String> sorted = new ArrayList<>(toppings);
        Collections.sort(sorted);
        return teaBase + ":" + String.join(",", sorted);
    }

    private static String getRatingDescription(BigDecimal rating) {
        double val = rating.doubleValue();
        if (val >= 9.0) return "神级搭配，绝对爆款！";
        if (val >= 8.0) return "非常受欢迎，强烈推荐！";
        if (val >= 7.0) return "不错的搭配，值得尝试！";
        if (val >= 6.0) return "普通组合，可以一试！";
        return "较为小众，适合口味独特的你";
    }
}
