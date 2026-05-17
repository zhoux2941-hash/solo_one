package com.prison.call.service;

import com.prison.call.entity.SensitiveWord;
import com.prison.call.repository.SensitiveWordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SensitiveWordService {
    
    @Autowired
    private SensitiveWordRepository sensitiveWordRepository;
    
    @PostConstruct
    public void initDefaultWords() {
        if (sensitiveWordRepository.count() == 0) {
            String[] defaultWords = {
                "越狱", "逃跑", "逃狱", "劫狱",
                "袭击", "打人", "杀人", "报复",
                "毒品", "白粉", "海洛因", "冰毒",
                "枪支", "刀", "武器", "炸药",
                "自杀", "自残", "上吊",
                "贿赂", "送礼", "钱", "好处"
            };
            
            for (String word : defaultWords) {
                SensitiveWord sensitiveWord = new SensitiveWord();
                sensitiveWord.setWord(word);
                sensitiveWord.setCategory(getCategory(word));
                sensitiveWord.setSeverityLevel(getSeverity(word));
                sensitiveWordRepository.save(sensitiveWord);
            }
        }
    }
    
    private String getCategory(String word) {
        if (word.matches("越狱|逃跑|逃狱|劫狱")) return "逃脱";
        if (word.matches("袭击|打人|杀人|报复")) return "暴力";
        if (word.matches("毒品|白粉|海洛因|冰毒")) return "毒品";
        if (word.matches("枪支|刀|武器|炸药")) return "武器";
        if (word.matches("自杀|自残|上吊")) return "自伤";
        return "其他";
    }
    
    private Integer getSeverity(String word) {
        if (word.matches("越狱|劫狱|杀人|毒品|枪支|炸药")) return 3;
        if (word.matches("逃跑|逃狱|袭击|报复|海洛因|冰毒|刀|武器|自杀|自残|上吊")) return 2;
        return 1;
    }
    
    public List<String> detectSensitiveWords(String text) {
        if (text == null || text.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<SensitiveWord> words = sensitiveWordRepository.findByEnabledTrue();
        List<String> found = new ArrayList<>();
        
        for (SensitiveWord word : words) {
            if (text.contains(word.getWord())) {
                found.add(word.getWord());
            }
        }
        return found.stream().distinct().collect(Collectors.toList());
    }
    
    public List<SensitiveWord> getAllWords() {
        return sensitiveWordRepository.findAll();
    }
    
    public SensitiveWord addWord(SensitiveWord word) {
        return sensitiveWordRepository.save(word);
    }
    
    public void deleteWord(Long id) {
        sensitiveWordRepository.deleteById(id);
    }
}
