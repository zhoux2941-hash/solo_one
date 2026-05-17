package com.construction.service;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.ConstructionNode;
import com.construction.repository.ConstructionNodeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.annotation.Resource;
import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ConstructionNodeService {

    @Resource
    private ConstructionNodeRepository constructionNodeRepository;

    public Result<PageResult<ConstructionNode>> getNodeList(Integer pageNum, Integer pageSize, Long projectId, Long parentId, String currentStatus) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.ASC, "nodeOrder"));

        Specification<ConstructionNode> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (projectId != null) {
                predicates.add(criteriaBuilder.equal(root.get("projectId"), projectId));
            }

            if (parentId != null) {
                predicates.add(criteriaBuilder.equal(root.get("parentId"), parentId));
            }

            if (StringUtils.hasText(currentStatus)) {
                predicates.add(criteriaBuilder.equal(root.get("currentStatus"), currentStatus));
            }

            predicates.add(criteriaBuilder.equal(root.get("status"), 1));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<ConstructionNode> page = constructionNodeRepository.findAll(spec, pageable);
        return Result.success(PageResult.of(page));
    }

    public Result<List<ConstructionNode>> getNodeTree(Long projectId) {
        List<ConstructionNode> rootNodes = constructionNodeRepository.findByProjectIdAndParentId(projectId, null);
        return Result.success(rootNodes);
    }

    public Result<ConstructionNode> getNodeById(Long id) {
        ConstructionNode node = constructionNodeRepository.findById(id).orElse(null);
        if (node == null) {
            return Result.error("节点不存在");
        }
        return Result.success(node);
    }

    @Transactional
    public Result<ConstructionNode> addNode(ConstructionNode node) {
        if (constructionNodeRepository.existsByNodeNameAndProjectId(node.getNodeName(), node.getProjectId())) {
            return Result.error("该项目下已存在同名节点");
        }

        node.setId(null);
        ConstructionNode saved = constructionNodeRepository.save(node);
        return Result.success("添加成功", saved);
    }

    @Transactional
    public Result<ConstructionNode> updateNode(Long id, ConstructionNode node) {
        ConstructionNode existing = constructionNodeRepository.findById(id).orElse(null);
        if (existing == null) {
            return Result.error("节点不存在");
        }

        if (constructionNodeRepository.existsByNodeNameAndProjectIdAndIdNot(node.getNodeName(), node.getProjectId(), id)) {
            return Result.error("该项目下已存在同名节点");
        }

        existing.setNodeName(node.getNodeName());
        existing.setNodeCode(node.getNodeCode());
        existing.setNodeType(node.getNodeType());
        existing.setNodeOrder(node.getNodeOrder());
        existing.setParentId(node.getParentId());
        existing.setPlannedStartDate(node.getPlannedStartDate());
        existing.setPlannedEndDate(node.getPlannedEndDate());
        existing.setActualStartDate(node.getActualStartDate());
        existing.setActualEndDate(node.getActualEndDate());
        existing.setPlannedWorkload(node.getPlannedWorkload());
        existing.setResponsiblePerson(node.getResponsiblePerson());
        existing.setResponsiblePhone(node.getResponsiblePhone());
        existing.setDescription(node.getDescription());

        ConstructionNode updated = constructionNodeRepository.save(existing);
        return Result.success("更新成功", updated);
    }

    @Transactional
    public Result<Void> deleteNode(Long id) {
        List<ConstructionNode> children = constructionNodeRepository.findByParentId(id);
        if (!children.isEmpty()) {
            return Result.error("该节点存在子节点，无法删除");
        }

        if (!constructionNodeRepository.existsById(id)) {
            return Result.error("节点不存在");
        }
        constructionNodeRepository.deleteById(id);
        return Result.success("删除成功");
    }

    @Transactional
    public Result<ConstructionNode> updateNodeProgress(Long id, ConstructionNode progressData) {
        ConstructionNode existing = constructionNodeRepository.findById(id).orElse(null);
        if (existing == null) {
            return Result.error("节点不存在");
        }

        if (progressData.getCompletedWorkload() != null) {
            existing.setCompletedWorkload(progressData.getCompletedWorkload());
        }

        if (progressData.getProgressRate() != null) {
            existing.setProgressRate(progressData.getProgressRate());
        }

        if (progressData.getCurrentStatus() != null) {
            existing.setCurrentStatus(progressData.getCurrentStatus());
        }

        if (progressData.getObstacles() != null) {
            existing.setObstacles(progressData.getObstacles());
        }

        if (progressData.getActualStartDate() != null && existing.getActualStartDate() == null) {
            existing.setActualStartDate(progressData.getActualStartDate());
        }

        if ("COMPLETED".equals(progressData.getCurrentStatus()) && existing.getActualEndDate() == null) {
            existing.setActualEndDate(progressData.getActualEndDate());
        }

        ConstructionNode updated = constructionNodeRepository.save(existing);
        return Result.success("进度更新成功", updated);
    }

    public Result<List<ConstructionNode>> getNodesByProjectId(Long projectId) {
        List<ConstructionNode> nodes = constructionNodeRepository.findByProjectId(projectId);
        return Result.success(nodes);
    }
}
