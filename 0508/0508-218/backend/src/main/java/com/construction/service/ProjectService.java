package com.construction.service;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.Project;
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
public class ProjectService {

    @Resource
    private ProjectRepository projectRepository;

    public Result<PageResult<Project>> getProjectList(Integer pageNum, Integer pageSize, String keyword, Integer status) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));

        Specification<Project> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(keyword)) {
                Predicate nameLike = criteriaBuilder.like(root.get("projectName"), "%" + keyword + "%");
                Predicate codeLike = criteriaBuilder.like(root.get("projectCode"), "%" + keyword + "%");
                Predicate managerLike = criteriaBuilder.like(root.get("projectManager"), "%" + keyword + "%");
                predicates.add(criteriaBuilder.or(nameLike, codeLike, managerLike));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            predicates.add(criteriaBuilder.equal(root.get("archived"), 0));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<Project> page = projectRepository.findAll(spec, pageable);
        return Result.success(PageResult.of(page));
    }

    public Result<Project> getProjectById(Long id) {
        Project project = projectRepository.findById(id).orElse(null);
        if (project == null) {
            return Result.error("项目不存在");
        }
        return Result.success(project);
    }

    public Result<Project> addProject(Project project) {
        if (projectRepository.existsByProjectName(project.getProjectName())) {
            return Result.error("项目名称已存在");
        }

        project.setId(null);
        project.setArchived(0);
        Project saved = projectRepository.save(project);
        return Result.success("添加成功", saved);
    }

    public Result<Project> updateProject(Long id, Project project) {
        Project existing = projectRepository.findById(id).orElse(null);
        if (existing == null) {
            return Result.error("项目不存在");
        }

        if (projectRepository.existsByProjectNameAndIdNot(project.getProjectName(), id)) {
            return Result.error("项目名称已存在");
        }

        existing.setProjectName(project.getProjectName());
        existing.setProjectCode(project.getProjectCode());
        existing.setConstructionAddress(project.getConstructionAddress());
        existing.setConstructionUnit(project.getConstructionUnit());
        existing.setContractorUnit(project.getContractorUnit());
        existing.setStartDate(project.getStartDate());
        existing.setEndDate(project.getEndDate());
        existing.setProjectManager(project.getProjectManager());
        existing.setManagerPhone(project.getManagerPhone());
        existing.setDescription(project.getDescription());

        Project updated = projectRepository.save(existing);
        return Result.success("更新成功", updated);
    }

    public Result<Void> deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            return Result.error("项目不存在");
        }
        projectRepository.deleteById(id);
        return Result.success("删除成功");
    }

    public Result<Void> toggleProjectStatus(Long id) {
        Project project = projectRepository.findById(id).orElse(null);
        if (project == null) {
            return Result.error("项目不存在");
        }

        project.setStatus(project.getStatus() == 1 ? 0 : 1);
        projectRepository.save(project);
        return Result.success(project.getStatus() == 1 ? "项目已启用" : "项目已停用");
    }

    public Result<Void> archiveProject(Long id) {
        Project project = projectRepository.findById(id).orElse(null);
        if (project == null) {
            return Result.error("项目不存在");
        }

        project.setArchived(1);
        projectRepository.save(project);
        return Result.success("项目已归档");
    }

    public Result<List<Project>> getAllActiveProjects() {
        List<Project> projects = projectRepository.findAll((root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.equal(root.get("status"), 1));
            predicates.add(criteriaBuilder.equal(root.get("archived"), 0));
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        }, Sort.by(Sort.Direction.DESC, "createTime"));
        return Result.success(projects);
    }
}
