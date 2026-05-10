package com.graftingassistant.algorithm;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class AntiCheatTest {
    
    public static void main(String[] args) {
        BayesianAverageCalculator calculator = new BayesianAverageCalculator();
        
        System.out.println("=== 反作弊机制测试 ===");
        System.out.println();
        
        testScenario1(calculator);
        System.out.println();
        testScenario2(calculator);
        System.out.println();
        testScenario3(calculator);
    }
    
    private static void testScenario1(BayesianAverageCalculator calculator) {
        System.out.println("场景1：初始状态（无记录）");
        System.out.println("初始评分: 90分");
        System.out.println("结果: " + calculator.calculateBayesianScore(90, new ArrayList<>()));
        System.out.println("预期: 90");
    }
    
    private static void testScenario2(BayesianAverageCalculator calculator) {
        System.out.println("场景2：5条正常记录 + 100条恶意100%记录");
        System.out.println("初始评分: 90分");
        
        List<BigDecimal> rates = new ArrayList<>();
        
        for (int i = 0; i < 5; i++) {
            rates.add(BigDecimal.valueOf(85.00));
        }
        
        for (int i = 0; i < 100; i++) {
            rates.add(BigDecimal.valueOf(100.00));
        }
        
        int result = calculator.calculateBayesianScore(90, rates);
        System.out.println("恶意攻击前评分（5条85%）: " + calculator.calculateBayesianScore(90, rates.subList(0, 5)));
        System.out.println("攻击后评分（105条记录）: " + result);
        System.out.println("预期: 不应接近85-92之间（被有效限制");
    }
    
    private static void testScenario3(BayesianAverageCalculator calculator) {
        System.out.println("场景3：异常值检测测试");
        System.out.println("初始评分: 80分");
        
        List<BigDecimal> rates = new ArrayList<>();
        rates.add(BigDecimal.valueOf(75.00));
        rates.add(BigDecimal.valueOf(80.00));
        rates.add(BigDecimal.valueOf(82.00));
        rates.add(BigDecimal.valueOf(78.00));
        rates.add(BigDecimal.valueOf(81.00));
        rates.add(BigDecimal.valueOf(100.00));
        
        int withoutOutlier = calculator.calculateBayesianScore(80, rates.subList(0, 5));
        int withOutlier = calculator.calculateBayesianScore(80, rates);
        
        System.out.println("无异常值评分: " + withoutOutlier);
        System.out.println("含异常值评分: " + withOutlier);
        System.out.println("预期: 两者应该接近（异常值被过滤");
    }
}
