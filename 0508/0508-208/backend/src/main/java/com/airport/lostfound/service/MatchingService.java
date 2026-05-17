package com.airport.lostfound.service;

import com.airport.lostfound.model.FoundItem;
import com.airport.lostfound.model.LostClaim;
import com.airport.lostfound.model.MatchResult;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MatchingService {

    private static final Set<String> STOP_WORDS = new HashSet<>(
            Arrays.asList("的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一", "一个", "上", "也", "很", "到", "说", "要", "去", "你", "会", "着", "没有", "看", "好", "自己", "这", "那", "个", "只", "件", "双", "个", "台", "部")
    );

    private static final Map<String, Set<String>> SYNONYM_MAP = new HashMap<>();
    private static final Map<String, Set<String>> COLOR_MAP = new HashMap<>();
    private static final Map<String, Set<String>> CATEGORY_MAP = new HashMap<>();

    static {
        SYNONYM_MAP.put("手机", new HashSet<>(Arrays.asList("手机", "电话", "iphone", "苹果手机", "安卓手机", "智能手机")));
        SYNONYM_MAP.put("钱包", new HashSet<>(Arrays.asList("钱包", "皮夹", "钱夹", "钱包夹", "purse", "wallet")));
        SYNONYM_MAP.put("身份证", new HashSet<>(Arrays.asList("身份证", "身份卡", "id卡", "idcard")));
        SYNONYM_MAP.put("银行卡", new HashSet<>(Arrays.asList("银行卡", "信用卡", "借记卡", "储蓄卡", "银行卡片")));
        SYNONYM_MAP.put("钥匙", new HashSet<>(Arrays.asList("钥匙", "锁匙", "钥匙串", "钥匙扣")));
        SYNONYM_MAP.put("电脑", new HashSet<>(Arrays.asList("电脑", "笔记本", "笔记本电脑", "laptop", "macbook")));
        SYNONYM_MAP.put("平板", new HashSet<>(Arrays.asList("平板", "平板电脑", "ipad", "pad")));
        SYNONYM_MAP.put("耳机", new HashSet<>(Arrays.asList("耳机", "耳塞", "耳麦", "蓝牙耳机", "airpods")));
        SYNONYM_MAP.put("手表", new HashSet<>(Arrays.asList("手表", "腕表", "手表", "watch", "iwatch")));
        SYNONYM_MAP.put("眼镜", new HashSet<>(Arrays.asList("眼镜", "墨镜", "太阳镜", "近视镜", "眼镜框")));
        SYNONYM_MAP.put("行李箱", new HashSet<>(Arrays.asList("行李箱", "拉杆箱", "旅行箱", "箱子", "皮箱")));
        SYNONYM_MAP.put("背包", new HashSet<>(Arrays.asList("背包", "书包", "双肩包", "单肩包", "挎包")));
        SYNONYM_MAP.put("雨伞", new HashSet<>(Arrays.asList("雨伞", "伞", "遮阳伞", "折叠伞")));
        SYNONYM_MAP.put("杯子", new HashSet<>(Arrays.asList("杯子", "水杯", "保温杯", "茶杯", "水瓶")));
        SYNONYM_MAP.put("护照", new HashSet<>(Arrays.asList("护照", "通行证", "证件")));
        SYNONYM_MAP.put("机票", new HashSet<>(Arrays.asList("机票", "登机牌", "机票")));

        COLOR_MAP.put("黑色", new HashSet<>(Arrays.asList("黑色", "黑", "黑的", "纯黑", "黑色的", "black")));
        COLOR_MAP.put("白色", new HashSet<>(Arrays.asList("白色", "白", "白的", "纯白", "白色的", "white")));
        COLOR_MAP.put("红色", new HashSet<>(Arrays.asList("红色", "红", "红的", "大红", "红色的", "red")));
        COLOR_MAP.put("蓝色", new HashSet<>(Arrays.asList("蓝色", "蓝", "蓝的", "蓝色的", "blue", "深蓝", "浅蓝")));
        COLOR_MAP.put("绿色", new HashSet<>(Arrays.asList("绿色", "绿", "绿的", "绿色的", "green")));
        COLOR_MAP.put("黄色", new HashSet<>(Arrays.asList("黄色", "黄", "黄的", "黄色的", "yellow")));
        COLOR_MAP.put("紫色", new HashSet<>(Arrays.asList("紫色", "紫", "紫的", "紫色的", "purple")));
        COLOR_MAP.put("粉色", new HashSet<>(Arrays.asList("粉色", "粉", "粉的", "粉色的", "pink")));
        COLOR_MAP.put("橙色", new HashSet<>(Arrays.asList("橙色", "橙", "橙的", "橙色的", "orange")));
        COLOR_MAP.put("灰色", new HashSet<>(Arrays.asList("灰色", "灰", "灰的", "灰色的", "gray", "grey")));
        COLOR_MAP.put("银色", new HashSet<>(Arrays.asList("银色", "银", "银的", "银色的", "silver")));
        COLOR_MAP.put("金色", new HashSet<>(Arrays.asList("金色", "金", "金的", "金色的", "gold")));
        COLOR_MAP.put("棕色", new HashSet<>(Arrays.asList("棕色", "棕", "棕的", "棕色的", "brown")));

        CATEGORY_MAP.put("电子产品", new HashSet<>(Arrays.asList("手机", "电脑", "平板", "耳机", "手表", "相机", "充电器", "数据线", "充电宝", "耳机盒")));
        CATEGORY_MAP.put("随身物品", new HashSet<>(Arrays.asList("钱包", "钥匙", "眼镜", "雨伞", "帽子", "围巾", "手套")));
        CATEGORY_MAP.put("证件票据", new HashSet<>(Arrays.asList("身份证", "护照", "银行卡", "信用卡", "机票", "登机牌")));
        CATEGORY_MAP.put("箱包", new HashSet<>(Arrays.asList("行李箱", "背包", "手提包", "拉杆箱", "旅行箱")));
    }

    public List<MatchResult> findMatches(LostClaim lostClaim, List<FoundItem> foundItems) {
        List<MatchResult> results = new ArrayList<>();

        for (FoundItem item : foundItems) {
            if (!"待认领".equals(item.getStatus())) {
                continue;
            }

            MatchDetail detail = calculateMatchScore(lostClaim, item);
            
            if (detail.score > 30) {
                results.add(new MatchResult(item, lostClaim, detail.score, detail.reason));
            }
        }

        return results.stream()
                .sorted((a, b) -> Double.compare(b.getMatchScore(), a.getMatchScore()))
                .collect(Collectors.toList());
    }

    private static class MatchDetail {
        double score;
        String reason;
        MatchDetail(double score, String reason) {
            this.score = score;
            this.reason = reason;
        }
    }

    private MatchDetail calculateMatchScore(LostClaim claim, FoundItem item) {
        double score = 0;
        List<String> reasons = new ArrayList<>();

        Set<String> claimWords = extractAllWords(claim.getItemDescription());
        Set<String> itemWords = extractAllWords(
            item.getItemName() + " " + item.getBrand() + " " + item.getColor() + " " + item.getDescription()
        );

        int categoryMatch = matchCategory(claimWords, itemWords);
        if (categoryMatch > 0) {
            score += categoryMatch * 20;
            reasons.add("物品类型匹配");
        }

        int synonymMatch = matchSynonyms(claimWords, itemWords);
        if (synonymMatch > 0) {
            score += synonymMatch * 15;
            reasons.add("物品特征匹配 x" + synonymMatch);
        }

        int colorMatch = matchColor(claimWords, itemWords);
        if (colorMatch > 0) {
            score += colorMatch * 20;
            reasons.add("颜色匹配");
        }

        Set<String> exactMatches = new HashSet<>(claimWords);
        exactMatches.retainAll(itemWords);
        exactMatches.removeAll(STOP_WORDS);
        if (exactMatches.size() > 0) {
            score += Math.min(exactMatches.size() * 8, 24);
        }

        int locationScore = calculateLocationScore(claim.getLostLocation(), item.getFoundLocation());
        if (locationScore > 0) {
            score += locationScore;
            if (locationScore >= 30) {
                reasons.add("地点精确匹配");
            } else if (locationScore >= 15) {
                reasons.add("地点区域匹配");
            } else {
                reasons.add("地点部分匹配");
            }
        }

        if (claim.getLostDate() != null && item.getFoundDate() != null) {
            long daysDiff = Math.abs(claim.getLostDate().toEpochDay() - item.getFoundDate().toEpochDay());
            if (daysDiff <= 0) {
                score += 20;
                reasons.add("同一天");
            } else if (daysDiff <= 1) {
                score += 15;
                reasons.add("日期接近");
            } else if (daysDiff <= 3) {
                score += 10;
            } else if (daysDiff <= 7) {
                score += 5;
            }
        }

        if (item.getBrand() != null && !item.getBrand().isEmpty()) {
            String brandLower = item.getBrand().toLowerCase();
            for (String word : claimWords) {
                if (brandLower.contains(word) || word.contains(brandLower)) {
                    score += 15;
                    reasons.add("品牌匹配: " + item.getBrand());
                    break;
                }
            }
        }

        return new MatchDetail(Math.min(score, 100), String.join("; ", reasons));
    }

    private Set<String> extractAllWords(String text) {
        if (text == null || text.trim().isEmpty()) {
            return new HashSet<>();
        }

        Set<String> words = new HashSet<>();
        String[] split = text.toLowerCase().split("[\\s,，.。!！?？;:：、()（）【】\\[\\]\"\"''\\-+]+");

        for (String word : split) {
            word = word.trim();
            if (!word.isEmpty() && word.length() >= 1 && !STOP_WORDS.contains(word)) {
                words.add(word);
            }
        }

        return words;
    }

    private int matchSynonyms(Set<String> claimWords, Set<String> itemWords) {
        int matches = 0;
        
        for (Map.Entry<String, Set<String>> entry : SYNONYM_MAP.entrySet()) {
            Set<String> synonyms = entry.getValue();
            boolean claimHas = false;
            boolean itemHas = false;
            
            for (String syn : synonyms) {
                if (containsAny(claimWords, syn)) claimHas = true;
                if (containsAny(itemWords, syn)) itemHas = true;
            }
            
            if (claimHas && itemHas) {
                matches++;
            }
        }
        
        return matches;
    }

    private int matchColor(Set<String> claimWords, Set<String> itemWords) {
        for (Map.Entry<String, Set<String>> entry : COLOR_MAP.entrySet()) {
            Set<String> colorSynonyms = entry.getValue();
            boolean claimHas = false;
            boolean itemHas = false;
            
            for (String syn : colorSynonyms) {
                if (containsAny(claimWords, syn)) claimHas = true;
                if (containsAny(itemWords, syn)) itemHas = true;
            }
            
            if (claimHas && itemHas) {
                return 1;
            }
        }
        return 0;
    }

    private int matchCategory(Set<String> claimWords, Set<String> itemWords) {
        for (Map.Entry<String, Set<String>> entry : CATEGORY_MAP.entrySet()) {
            Set<String> categoryItems = entry.getValue();
            boolean claimHas = false;
            boolean itemHas = false;
            
            for (String item : categoryItems) {
                if (containsAny(claimWords, item)) claimHas = true;
                if (containsAny(itemWords, item)) itemHas = true;
            }
            
            if (claimHas && itemHas) {
                return 1;
            }
        }
        return 0;
    }

    private boolean containsAny(Set<String> words, String target) {
        for (String word : words) {
            if (word.contains(target) || target.contains(word)) {
                return true;
            }
        }
        return false;
    }

    private int calculateLocationScore(String claimLocation, String itemLocation) {
        if (claimLocation == null || claimLocation.isEmpty() || itemLocation == null || itemLocation.isEmpty()) {
            return 0;
        }

        claimLocation = claimLocation.toLowerCase();
        itemLocation = itemLocation.toLowerCase();

        if (claimLocation.equals(itemLocation)) {
            return 35;
        }

        String claimTerminal = extractTerminal(claimLocation);
        String itemTerminal = extractTerminal(itemLocation);
        
        if (!claimTerminal.isEmpty() && !itemTerminal.isEmpty()) {
            if (claimTerminal.equals(itemTerminal)) {
                if (extractGate(claimLocation).equals(extractGate(itemLocation))) {
                    return 30;
                }
                return 20;
            }
        }

        if (claimLocation.contains(itemLocation) || itemLocation.contains(claimLocation)) {
            return 15;
        }

        Set<String> claimLocWords = extractLocationKeywords(claimLocation);
        Set<String> itemLocWords = extractLocationKeywords(itemLocation);
        
        claimLocWords.retainAll(itemLocWords);
        if (claimLocWords.size() >= 2) {
            return 15;
        } else if (claimLocWords.size() >= 1) {
            return 10;
        }

        return 0;
    }

    private String extractTerminal(String location) {
        if (location.contains("t1") || location.contains("1号") || location.contains("一号") || location.contains("1楼")) return "T1";
        if (location.contains("t2") || location.contains("2号") || location.contains("二号") || location.contains("2楼")) return "T2";
        if (location.contains("t3") || location.contains("3号") || location.contains("三号") || location.contains("3楼")) return "T3";
        if (location.contains("t4") || location.contains("4号") || location.contains("四号") || location.contains("4楼")) return "T4";
        return "";
    }

    private String extractGate(String location) {
        if (location.contains("登机口")) {
            int idx = location.indexOf("登机口");
            if (idx + 3 < location.length()) {
                return location.substring(idx + 3).trim().replaceAll("[^a-z0-9]", "");
            }
        }
        return "";
    }

    private Set<String> extractLocationKeywords(String location) {
        Set<String> keywords = new HashSet<>();
        String[] locKeywords = {"安检", "大厅", "候机", "登机口", "出站", "进站", "行李", "取行李", "托运",
                                "卫生间", "厕所", "洗手间", "餐厅", "餐饮", "商店", "免税店", "出口", "入口",
                                "柜台", "值机", "服务台", "问讯处", "电梯", "扶梯", "楼梯", "行李架", "座位",
                                "候车", "候机室", "贵宾室", "商务舱", "头等舱", "经济舱"};
        
        for (String keyword : locKeywords) {
            if (location.contains(keyword)) {
                keywords.add(keyword);
            }
        }
        return keywords;
    }
}
