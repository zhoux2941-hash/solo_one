package com.construction.service;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.ConstructionArea;
import com.construction.entity.Project;
import com.construction.repository.ConstructionAreaRepository;
import com.construction.repository.ProjectRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.annotation.Resource;
import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ConstructionAreaService {

    @Resource
    private ConstructionAreaRepository areaRepository;

    @Resource
    private ProjectRepository projectRepository;

    public Result<PageResult<ConstructionArea>> getAreaList(Integer pageNum, Integer pageSize, Long projectId, String areaType, String keyword) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));

        Specification<ConstructionArea> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (projectId != null) {
                predicates.add(criteriaBuilder.equal(root.get("projectId"), projectId));
            }

            if (StringUtils.hasText(areaType)) {
                predicates.add(criteriaBuilder.equal(root.get("areaType"), areaType));
            }

            if (StringUtils.hasText(keyword)) {
                Predicate nameLike = criteriaBuilder.like(root.get("areaName"), "%" + keyword + "%");
                Predicate buildingLike = criteriaBuilder.like(root.get("buildingUnit"), "%" + keyword + "%");
                Predicate managerLike = criteriaBuilder.like(root.get("managerName"), "%" + keyword + "%");
                predicates.add(criteriaBuilder.or(nameLike, buildingLike, managerLike));
            }

            predicates.add(criteriaBuilder.equal(root.get("status"), 1));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<ConstructionArea> page = areaRepository.findAll(spec, pageable);

        for (ConstructionArea area : page.getContent()) {
            Project project = projectRepository.findById(area.getProjectId()).orElse(null);
            if (project != null) {
                area.setProjectName(project.getProjectName());
            }
        }

        return Result.success(PageResult.of(page));
    }

    public Result<ConstructionArea> getAreaById(Long id) {
        ConstructionArea area = areaRepository.findById(id).orElse(null);
        if (area == null) {
            return Result.error("区域不存在");
        }

        Project project = projectRepository.findById(area.getProjectId()).orElse(null);
        if (project != null) {
            area.setProjectName(project.getProjectName());
        }

        return Result.success(area);
    }

    public Result<ConstructionArea> addArea(ConstructionArea area) {
        if (!projectRepository.existsById(area.getProjectId())) {
            return Result.error("所属项目不存在");
        }

        if (areaRepository.existsByAreaNameAndProjectId(area.getAreaName(), area.getProjectId())) {
            return Result.error("该项目下已存在相同名称的区域");
        }

        area.setId(null);
        ConstructionArea saved = areaRepository.save(area);
        return Result.success("添加成功", saved);
    }

    public Result<ConstructionArea> updateArea(Long id, ConstructionArea area) {
        ConstructionArea existing = areaRepository.findById(id).orElse(null);
        if (existing == null) {
            return Result.error("区域不存在");
        }

        if (!projectRepository.existsById(area.getProjectId())) {
            return Result.error("所属项目不存在");
        }

        if (areaRepository.existsByAreaNameAndProjectIdAndIdNot(area.getAreaName(), area.getProjectId(), id)) {
            return Result.error("该项目下已存在相同名称的区域");
        }

        existing.setProjectId(area.getProjectId());
        existing.setAreaName(area.getAreaName());
        existing.setAreaCode(area.getAreaCode());
        existing.setAreaType(area.getAreaType());
        existing.setBuildingUnit(area.getBuildingUnit());
        existing.setConstructionSection(area.getConstructionSection());
        existing.setManagerName(area.getManagerName());
        existing.setManagerPhone(area.getManagerPhone());
        existing.setDescription(area.getDescription());

        ConstructionArea updated = areaRepository.save(existing);
        return Result.success("更新成功", updated);
    }

    public Result<Void> deleteArea(Long id) {
        if (!areaRepository.existsById(id)) {
            return Result.error("区域不存在");
        }
        areaRepository.deleteById(id);
        return Result.success("删除成功");
    }

    public Result<List<ConstructionArea>> getAreasByProjectId(Long projectId) {
        List<ConstructionArea> areas = areaRepository.findByProjectId(projectId);
        return Result.success(areas);
    }
}
