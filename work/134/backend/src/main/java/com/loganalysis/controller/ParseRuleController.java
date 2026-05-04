package com.loganalysis.controller;

import com.loganalysis.dto.ApiResponse;
import com.loganalysis.entity.ParseRule;
import com.loganalysis.service.ParseRuleService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * 解析规则管理控制器
 */
@RestController
@RequestMapping("/api/rules")
@CrossOrigin(origins = "*")
@Slf4j
public class ParseRuleController {

    @Autowired
    private ParseRuleService parseRuleService;

    /**
     * 获取所有解析规则
     */
    @GetMapping
    public ApiResponse<List<ParseRule>> getAllRules() {
        log.info("获取所有解析规则");
        List<ParseRule> rules = parseRuleService.getAllRules();
        return ApiResponse.success(rules);
    }

    /**
     * 获取所有启用的解析规则
     */
    @GetMapping("/active")
    public ApiResponse<List<ParseRule>> getActiveRules() {
        log.info("获取所有启用的解析规则");
        List<ParseRule> rules = parseRuleService.getAllActiveRules();
        return ApiResponse.success(rules);
    }

    /**
     * 根据 ID 获取解析规则
     */
    @GetMapping("/{id}")
    public ApiResponse<ParseRule> getRuleById(@PathVariable Long id) {
        log.info("获取解析规则: {}", id);
        return parseRuleService.getRuleById(id)
            .map(rule -> ApiResponse.success(rule))
            .orElse(ApiResponse.error("规则不存在: " + id));
    }

    /**
     * 根据日志类型获取解析规则
     */
    @GetMapping("/type/{logType}")
    public ApiResponse<List<ParseRule>> getRulesByLogType(@PathVariable String logType) {
        log.info("获取日志类型为 {} 的解析规则", logType);
        List<ParseRule> rules = parseRuleService.getRulesByLogType(logType);
        return ApiResponse.success(rules);
    }

    /**
     * 创建解析规则
     */
    @PostMapping
    public ApiResponse<ParseRule> createRule(@Valid @RequestBody ParseRule rule) {
        log.info("创建解析规则: {}", rule.getRuleName());
        try {
            ParseRule createdRule = parseRuleService.createRule(rule);
            return ApiResponse.success("规则创建成功", createdRule);
        } catch (Exception e) {
            log.error("创建解析规则失败", e);
            return ApiResponse.error("创建规则失败: " + e.getMessage());
        }
    }

    /**
     * 更新解析规则
     */
    @PutMapping("/{id}")
    public ApiResponse<ParseRule> updateRule(
            @PathVariable Long id,
            @Valid @RequestBody ParseRule rule) {
        log.info("更新解析规则: {}", id);
        try {
            ParseRule updatedRule = parseRuleService.updateRule(id, rule);
            return ApiResponse.success("规则更新成功", updatedRule);
        } catch (Exception e) {
            log.error("更新解析规则失败", e);
            return ApiResponse.error("更新规则失败: " + e.getMessage());
        }
    }

    /**
     * 删除解析规则
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteRule(@PathVariable Long id) {
        log.info("删除解析规则: {}", id);
        try {
            parseRuleService.deleteRule(id);
            return ApiResponse.success("规则删除成功", null);
        } catch (Exception e) {
            log.error("删除解析规则失败", e);
            return ApiResponse.error("删除规则失败: " + e.getMessage());
        }
    }

    /**
     * 启用解析规则
     */
    @PutMapping("/{id}/enable")
    public ApiResponse<ParseRule> enableRule(@PathVariable Long id) {
        log.info("启用解析规则: {}", id);
        try {
            ParseRule rule = parseRuleService.toggleRuleStatus(id, true);
            return ApiResponse.success("规则已启用", rule);
        } catch (Exception e) {
            log.error("启用解析规则失败", e);
            return ApiResponse.error("启用规则失败: " + e.getMessage());
        }
    }

    /**
     * 禁用解析规则
     */
    @PutMapping("/{id}/disable")
    public ApiResponse<ParseRule> disableRule(@PathVariable Long id) {
        log.info("禁用解析规则: {}", id);
        try {
            ParseRule rule = parseRuleService.toggleRuleStatus(id, false);
            return ApiResponse.success("规则已禁用", rule);
        } catch (Exception e) {
            log.error("禁用解析规则失败", e);
            return ApiResponse.error("禁用规则失败: " + e.getMessage());
        }
    }
}
