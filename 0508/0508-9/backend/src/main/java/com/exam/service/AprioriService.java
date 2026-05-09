package com.exam.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class AprioriService {
    
    private static final Map<String, String> ACTION_LABELS = new HashMap<>();
    
    static {
        ACTION_LABELS.put("VISIBILITY_CHANGE", "切出窗口");
        ACTION_LABELS.put("MOUSE_LEAVE", "鼠标离开");
        ACTION_LABELS.put("COPY", "复制");
        ACTION_LABELS.put("PASTE", "粘贴");
        ACTION_LABELS.put("RIGHT_CLICK", "右键菜单");
        ACTION_LABELS.put("KEYBOARD_SHORTCUT", "快捷键");
    }
    
    public List<Map<String, Object>> findFrequentPatterns(
            List<List<String>> transactions,
            double minSupport,
            double minConfidence) {
        
        log.info("Starting Apriori algorithm with {} transactions, minSupport={}, minConfidence={}", 
                transactions.size(), minSupport, minConfidence);
        
        Set<String> allItems = new HashSet<>();
        for (List<String> transaction : transactions) {
            allItems.addAll(transaction);
        }
        
        List<Set<String>> itemsets = new ArrayList<>();
        Map<Set<String>, Double> supportMap = new HashMap<>();
        
        Set<Set<String>> currentItemsets = new HashSet<>();
        for (String item : allItems) {
            Set<String> itemset = new HashSet<>();
            itemset.add(item);
            currentItemsets.add(itemset);
        }
        
        int k = 1;
        while (!currentItemsets.isEmpty()) {
            Map<Set<String>, Double> currentSupport = calculateSupport(currentItemsets, transactions);
            
            List<Set<String>> frequentItemsets = new ArrayList<>();
            for (Map.Entry<Set<String>, Double> entry : currentSupport.entrySet()) {
                if (entry.getValue() >= minSupport) {
                    frequentItemsets.add(entry.getKey());
                    supportMap.put(entry.getKey(), entry.getValue());
                    itemsets.add(entry.getKey());
                }
            }
            
            if (frequentItemsets.isEmpty()) {
                break;
            }
            
            k++;
            currentItemsets = generateCandidates(frequentItemsets, k);
        }
        
        List<Map<String, Object>> rules = generateAssociationRules(supportMap, minConfidence);
        
        log.info("Found {} frequent itemsets and {} association rules", itemsets.size(), rules.size());
        
        return rules;
    }
    
    private Map<Set<String>, Double> calculateSupport(
            Set<Set<String>> itemsets,
            List<List<String>> transactions) {
        
        Map<Set<String>, Double> supportMap = new HashMap<>();
        int total = transactions.size();
        
        for (Set<String> itemset : itemsets) {
            int count = 0;
            for (List<String> transaction : transactions) {
                if (containsAll(transaction, itemset)) {
                    count++;
                }
            }
            double support = total > 0 ? (double) count / total : 0;
            supportMap.put(itemset, support);
        }
        
        return supportMap;
    }
    
    private boolean containsAll(List<String> transaction, Set<String> itemset) {
        Set<String> transactionSet = new HashSet<>(transaction);
        return transactionSet.containsAll(itemset);
    }
    
    private Set<Set<String>> generateCandidates(List<Set<String>> frequentItemsets, int k) {
        Set<Set<String>> candidates = new HashSet<>();
        int n = frequentItemsets.size();
        
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                Set<String> set1 = frequentItemsets.get(i);
                Set<String> set2 = frequentItemsets.get(j);
                
                Set<String> union = new HashSet<>(set1);
                union.addAll(set2);
                
                if (union.size() == k) {
                    candidates.add(union);
                }
            }
        }
        
        return candidates;
    }
    
    private List<Map<String, Object>> generateAssociationRules(
            Map<Set<String>, Double> supportMap,
            double minConfidence) {
        
        List<Map<String, Object>> rules = new ArrayList<>();
        
        for (Map.Entry<Set<String>, Double> entry : supportMap.entrySet()) {
            Set<String> itemset = entry.getKey();
            double support = entry.getValue();
            
            if (itemset.size() < 2) {
                continue;
            }
            
            List<Set<String>> subsets = generateAllSubsets(itemset);
            
            for (Set<String> antecedent : subsets) {
                if (antecedent.isEmpty() || antecedent.size() == itemset.size()) {
                    continue;
                }
                
                Set<String> consequent = new HashSet<>(itemset);
                consequent.removeAll(antecedent);
                
                if (consequent.isEmpty()) {
                    continue;
                }
                
                Double antecedentSupport = supportMap.get(antecedent);
                if (antecedentSupport == null || antecedentSupport == 0) {
                    continue;
                }
                
                double confidence = support / antecedentSupport;
                
                if (confidence >= minConfidence) {
                    Double consequentSupport = supportMap.get(consequent);
                    double lift = consequentSupport != null ? 
                            confidence / consequentSupport : 0;
                    
                    Map<String, Object> rule = new HashMap<>();
                    rule.put("antecedent", new ArrayList<>(antecedent));
                    rule.put("antecedentLabels", getLabels(antecedent));
                    rule.put("consequent", new ArrayList<>(consequent));
                    rule.put("consequentLabels", getLabels(consequent));
                    rule.put("support", support);
                    rule.put("confidence", confidence);
                    rule.put("lift", lift);
                    rule.put("strength", calculateStrength(support, confidence, lift));
                    
                    rules.add(rule);
                }
            }
        }
        
        rules.sort((a, b) -> {
            double scoreA = (double) a.get("confidence") * 0.5 + (double) a.get("lift") * 0.3 + (double) a.get("support") * 0.2;
            double scoreB = (double) b.get("confidence") * 0.5 + (double) b.get("lift") * 0.3 + (double) b.get("support") * 0.2;
            return Double.compare(scoreB, scoreA);
        });
        
        return rules;
    }
    
    private List<Set<String>> generateAllSubsets(Set<String> itemset) {
        List<Set<String>> subsets = new ArrayList<>();
        List<String> items = new ArrayList<>(itemset);
        int n = items.size();
        
        for (int mask = 0; mask < (1 << n); mask++) {
            Set<String> subset = new HashSet<>();
            for (int i = 0; i < n; i++) {
                if ((mask & (1 << i)) != 0) {
                    subset.add(items.get(i));
                }
            }
            subsets.add(subset);
        }
        
        return subsets;
    }
    
    private List<String> getLabels(Set<String> actions) {
        List<String> labels = new ArrayList<>();
        for (String action : actions) {
            labels.add(ACTION_LABELS.getOrDefault(action, action));
        }
        return labels;
    }
    
    private double calculateStrength(double support, double confidence, double lift) {
        double normalizedSupport = Math.min(support * 10, 1.0);
        double normalizedLift = Math.min(lift / 3, 1.0);
        
        double strength = confidence * 0.5 + normalizedSupport * 0.3 + normalizedLift * 0.2;
        return Math.min(strength * 100, 100);
    }
    
    public List<Map<String, Object>> generateSequencePatterns(
            List<List<String>> sequences,
            int maxGap,
            double minSupport) {
        
        log.info("Generating sequence patterns from {} sequences with maxGap={}", sequences.size(), maxGap);
        
        Map<String, Integer> singleItemCount = new HashMap<>();
        Map<String, Map<String, Integer>> pairCount = new HashMap<>();
        
        for (List<String> sequence : sequences) {
            Set<String> seenInSequence = new HashSet<>();
            
            for (int i = 0; i < sequence.size(); i++) {
                String item1 = sequence.get(i);
                seenInSequence.add(item1);
                
                for (int j = i + 1; j < Math.min(i + maxGap + 1, sequence.size()); j++) {
                    String item2 = sequence.get(j);
                    
                    if (!item1.equals(item2)) {
                        String pair = item1 + " -> " + item2;
                        pairCount.computeIfAbsent(item1, k -> new HashMap<>())
                                .merge(item2, 1, Integer::sum);
                    }
                }
            }
            
            for (String item : seenInSequence) {
                singleItemCount.merge(item, 1, Integer::sum);
            }
        }
        
        List<Map<String, Object>> patterns = new ArrayList<>();
        int totalSequences = sequences.size();
        
        for (Map.Entry<String, Map<String, Integer>> entry : pairCount.entrySet()) {
            String from = entry.getKey();
            for (Map.Entry<String, Integer> pairEntry : entry.getValue().entrySet()) {
                String to = pairEntry.getKey();
                int count = pairEntry.getValue();
                
                double support = totalSequences > 0 ? (double) count / totalSequences : 0;
                
                if (support >= minSupport) {
                    Integer fromCount = singleItemCount.get(from);
                    double confidence = fromCount != null && fromCount > 0 ? 
                            (double) count / fromCount : 0;
                    
                    Map<String, Object> pattern = new HashMap<>();
                    pattern.put("from", from);
                    pattern.put("fromLabel", ACTION_LABELS.getOrDefault(from, from));
                    pattern.put("to", to);
                    pattern.put("toLabel", ACTION_LABELS.getOrDefault(to, to));
                    pattern.put("support", support);
                    pattern.put("confidence", confidence);
                    pattern.put("count", count);
                    pattern.put("strength", calculateStrength(support, confidence, 1.0));
                    
                    patterns.add(pattern);
                }
            }
        }
        
        patterns.sort((a, b) -> {
            double scoreA = (double) a.get("confidence") * 0.6 + (double) a.get("support") * 0.4;
            double scoreB = (double) b.get("confidence") * 0.6 + (double) b.get("support") * 0.4;
            return Double.compare(scoreB, scoreA);
        });
        
        log.info("Generated {} sequence patterns", patterns.size());
        
        return patterns;
    }
    
    public String getActionLabel(String actionType) {
        return ACTION_LABELS.getOrDefault(actionType, actionType);
    }
    
    public Set<String> getAllActionTypes() {
        return ACTION_LABELS.keySet();
    }
}
