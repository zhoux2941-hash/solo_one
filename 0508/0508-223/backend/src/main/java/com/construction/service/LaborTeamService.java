package com.construction.service;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.LaborTeam;
import com.construction.repository.LaborTeamRepository;
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
public class LaborTeamService {

    @Resource
    private LaborTeamRepository laborTeamRepository;

    public Result<PageResult<LaborTeam>> getTeamList(Integer pageNum, Integer pageSize, Long projectId, String keyword, Integer status) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));

        Specification<LaborTeam> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (projectId != null) {
                predicates.add(criteriaBuilder.equal(root.get("projectId"), projectId));
            }

            if (StringUtils.hasText(keyword)) {
                Predicate nameLike = criteriaBuilder.like(root.get("teamName"), "%" + keyword + "%");
                Predicate codeLike = criteriaBuilder.like(root.get("teamCode"), "%" + keyword + "%");
                Predicate leaderLike = criteriaBuilder.like(root.get("teamLeader"), "%" + keyword + "%");
                predicates.add(criteriaBuilder.or(nameLike, codeLike, leaderLike));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<LaborTeam> page = laborTeamRepository.findAll(spec, pageable);
        return Result.success(PageResult.of(page));
    }

    public Result<List<LaborTeam>> getAllActiveTeams(Long projectId) {
        List<LaborTeam> teams = laborTeamRepository.findByProjectIdAndStatus(projectId, 1);
        return Result.success(teams);
    }

    public Result<LaborTeam> getTeamById(Long id) {
        LaborTeam team = laborTeamRepository.findById(id).orElse(null);
        if (team == null) {
            return Result.error("班组不存在");
        }
        return Result.success(team);
    }

    public Result<LaborTeam> addTeam(LaborTeam team) {
        if (laborTeamRepository.existsByTeamNameAndProjectId(team.getTeamName(), team.getProjectId())) {
            return Result.error("该项目下已存在相同名称的班组");
        }

        team.setId(null);
        LaborTeam saved = laborTeamRepository.save(team);
        return Result.success("添加成功", saved);
    }

    public Result<LaborTeam> updateTeam(Long id, LaborTeam team) {
        LaborTeam existing = laborTeamRepository.findById(id).orElse(null);
        if (existing == null) {
            return Result.error("班组不存在");
        }

        if (laborTeamRepository.existsByTeamNameAndProjectIdAndIdNot(team.getTeamName(), team.getProjectId(), id)) {
            return Result.error("该项目下已存在相同名称的班组");
        }

        existing.setTeamName(team.getTeamName());
        existing.setTeamCode(team.getTeamCode());
        existing.setTeamType(team.getTeamType());
        existing.setTeamLeader(team.getTeamLeader());
        existing.setLeaderPhone(team.getLeaderPhone());
        existing.setDescription(team.getDescription());
        existing.setProjectId(team.getProjectId());

        LaborTeam updated = laborTeamRepository.save(existing);
        return Result.success("更新成功", updated);
    }

    public Result<Void> deleteTeam(Long id) {
        if (!laborTeamRepository.existsById(id)) {
            return Result.error("班组不存在");
        }
        laborTeamRepository.deleteById(id);
        return Result.success("删除成功");
    }

    public Result<Void> toggleTeamStatus(Long id) {
        LaborTeam team = laborTeamRepository.findById(id).orElse(null);
        if (team == null) {
            return Result.error("班组不存在");
        }

        team.setStatus(team.getStatus() == 1 ? 0 : 1);
        laborTeamRepository.save(team);
        return Result.success(team.getStatus() == 1 ? "班组已启用" : "班组已停用");
    }
}
