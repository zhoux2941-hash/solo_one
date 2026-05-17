package com.construction.service;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.ConstructionNode;
import com.construction.entity.NodeProgressReport;
import com.construction.repository.ConstructionNodeRepository;
import com.construction.repository.NodeProgressReportRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import javax.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class NodeProgressReportService {

    @Resource
    private NodeProgressReportRepository progressReportRepository;

    @Resource
    private ConstructionNodeRepository constructionNodeRepository;

    public Result<PageResult<NodeProgressReport>> getReportList(Integer pageNum, Integer pageSize, Long projectId, Long nodeId) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "reportDate"));

        Specification<NodeProgressReport> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (projectId != null) {
                predicates.add(criteriaBuilder.equal(root.get("projectId"), projectId));
            }

            if (nodeId != null) {
                predicates.add(criteriaBuilder.equal(root.get("nodeId"), nodeId));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<NodeProgressReport> page = progressReportRepository.findAll(spec, pageable);
        return Result.success(PageResult.of(page));
    }

    public Result<NodeProgressReport> getReportById(Long id) {
        NodeProgressReport report = progressReportRepository.findById(id).orElse(null);
        if (report == null) {
            return Result.error("报告不存在");
        }
        return Result.success(report);
    }

    @Transactional
    public Result<NodeProgressReport> addReport(NodeProgressReport report) {
        ConstructionNode node = constructionNodeRepository.findById(report.getNodeId()).orElse(null);
        if (node == null) {
            return Result.error("节点不存在");
        }

        report.setId(null);
        if (report.getReportDate() == null) {
            report.setReportDate(LocalDate.now());
        }

        NodeProgressReport saved = progressReportRepository.save(report);

        if (report.getProgressRate() != null && report.getProgressRate().compareTo(node.getProgressRate()) > 0) {
            node.setProgressRate(report.getProgressRate());
        }

        if (report.getCompletedWorkload() != null) {
            node.setCompletedWorkload(report.getCompletedWorkload());
        }

        if (report.getObstacles() != null) {
            node.setObstacles(report.getObstacles());
        }

        if (node.getActualStartDate() == null && report.getProgressRate().compareTo(BigDecimal.ZERO) > 0) {
            node.setActualStartDate(LocalDate.now());
            node.setCurrentStatus("IN_PROGRESS");
        }

        if (report.getProgressRate().compareTo(new BigDecimal("100")) >= 0) {
            node.setCurrentStatus("COMPLETED");
            node.setActualEndDate(LocalDate.now());
        }

        constructionNodeRepository.save(node);

        return Result.success("上报成功", saved);
    }

    @Transactional
    public Result<NodeProgressReport> updateReport(Long id, NodeProgressReport report) {
        NodeProgressReport existing = progressReportRepository.findById(id).orElse(null);
        if (existing == null) {
            return Result.error("报告不存在");
        }

        existing.setReportDate(report.getReportDate());
        existing.setReporter(report.getReporter());
        existing.setReporterPhone(report.getReporterPhone());
        existing.setCompletedWorkload(report.getCompletedWorkload());
        existing.setProgressRate(report.getProgressRate());
        existing.setWorkContent(report.getWorkContent());
        existing.setObstacles(report.getObstacles());
        existing.setSolutions(report.getSolutions());
        existing.setNextPlan(report.getNextPlan());
        existing.setWeatherCondition(report.getWeatherCondition());
        existing.setWorkerCount(report.getWorkerCount());

        NodeProgressReport updated = progressReportRepository.save(existing);
        return Result.success("更新成功", updated);
    }

    @Transactional
    public Result<Void> deleteReport(Long id) {
        if (!progressReportRepository.existsById(id)) {
            return Result.error("报告不存在");
        }
        progressReportRepository.deleteById(id);
        return Result.success("删除成功");
    }

    public Result<List<NodeProgressReport>> getReportsByNodeId(Long nodeId) {
        List<NodeProgressReport> reports = progressReportRepository.findByNodeIdOrderByReportDateDesc(nodeId);
        return Result.success(reports);
    }
}
