package com.loganalysis.repository;

import com.loganalysis.entity.ParseRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * 解析规则数据访问层
 */
@Repository
public interface ParseRuleRepository extends JpaRepository<ParseRule, Long> {

    /**
     * 根据日志类型和是否启用查询规则
     */
    List<ParseRule> findByLogTypeAndIsActive(String logType, Boolean isActive);

    /**
     * 查询所有启用的规则
     */
    List<ParseRule> findByIsActiveTrue();

    /**
     * 根据规则名称查询
     */
    Optional<ParseRule> findByRuleName(String ruleName);

    /**
     * 根据日志类型查询
     */
    List<ParseRule> findByLogType(String logType);
}
