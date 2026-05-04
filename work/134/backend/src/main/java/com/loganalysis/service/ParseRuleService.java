package com.loganalysis.service;

import com.loganalysis.entity.ParseRule;
import com.loganalysis.repository.ParseRuleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

/**
 * 解析规则服务类
 */
@Service
@Slf4j
public class ParseRuleService {

    @Autowired
    private ParseRuleRepository parseRuleRepository;

    /**
     * 获取所有解析规则
     */
    public List<ParseRule> getAllRules() {
        return parseRuleRepository.findAll();
    }

    /**
     * 获取所有启用的解析规则
     */
    public List<ParseRule> getAllActiveRules() {
        return parseRuleRepository.findByIsActiveTrue();
    }

    /**
     * 根据 ID 获取解析规则
     */
    public Optional<ParseRule> getRuleById(Long id) {
        return parseRuleRepository.findById(id);
    }

    /**
     * 根据规则名称获取解析规则
     */
    public Optional<ParseRule> getRuleByName(String ruleName) {
        return parseRuleRepository.findByRuleName(ruleName);
    }

    /**
     * 根据日志类型获取解析规则
     */
    public List<ParseRule> getRulesByLogType(String logType) {
        return parseRuleRepository.findByLogType(logType);
    }

    /**
     * 根据日志类型获取启用的解析规则
     */
    public List<ParseRule> getActiveRulesByLogType(String logType) {
        return parseRuleRepository.findByLogTypeAndIsActive(logType, true);
    }

    /**
     * 创建解析规则
     */
    @Transactional
    public ParseRule createRule(ParseRule rule) {
        // 检查规则名称是否已存在
        Optional<ParseRule> existingRule = parseRuleRepository.findByRuleName(rule.getRuleName());
        if (existingRule.isPresent()) {
            throw new RuntimeException("规则名称已存在: " + rule.getRuleName());
        }
        
        return parseRuleRepository.save(rule);
    }

    /**
     * 更新解析规则
     */
    @Transactional
    public ParseRule updateRule(Long id, ParseRule updatedRule) {
        Optional<ParseRule> existingRuleOpt = parseRuleRepository.findById(id);
        
        if (existingRuleOpt.isEmpty()) {
            throw new RuntimeException("规则不存在: " + id);
        }
        
        ParseRule existingRule = existingRuleOpt.get();
        
        // 更新字段
        existingRule.setRuleName(updatedRule.getRuleName());
        existingRule.setLogType(updatedRule.getLogType());
        existingRule.setRuleType(updatedRule.getRuleType());
        existingRule.setPattern(updatedRule.getPattern());
        existingRule.setFieldMapping(updatedRule.getFieldMapping());
        existingRule.setSampleLog(updatedRule.getSampleLog());
        existingRule.setIsActive(updatedRule.getIsActive());
        
        return parseRuleRepository.save(existingRule);
    }

    /**
     * 删除解析规则
     */
    @Transactional
    public void deleteRule(Long id) {
        if (!parseRuleRepository.existsById(id)) {
            throw new RuntimeException("规则不存在: " + id);
        }
        parseRuleRepository.deleteById(id);
    }

    /**
     * 启用/禁用解析规则
     */
    @Transactional
    public ParseRule toggleRuleStatus(Long id, boolean isActive) {
        Optional<ParseRule> ruleOpt = parseRuleRepository.findById(id);
        
        if (ruleOpt.isEmpty()) {
            throw new RuntimeException("规则不存在: " + id);
        }
        
        ParseRule rule = ruleOpt.get();
        rule.setIsActive(isActive);
        return parseRuleRepository.save(rule);
    }

    /**
     * 获取默认解析规则（内置的常用规则）
     */
    public List<ParseRule> getDefaultRules() {
        // 返回空列表，默认规则可以在应用启动时创建
        return List.of();
    }
}
