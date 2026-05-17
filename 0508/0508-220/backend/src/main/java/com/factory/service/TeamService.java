package com.factory.service;

import com.factory.common.Result;
import com.factory.entity.Team;
import com.factory.repository.TeamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    public Result<Page<Team>> findAll(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<Team> teams;
        
        if (keyword != null && !keyword.isEmpty()) {
            teams = teamRepository.findByTeamNameContaining(keyword, pageable);
        } else {
            teams = teamRepository.findAll(pageable);
        }
        
        return Result.success(teams);
    }

    public Result<List<Team>> findByLineId(Long lineId) {
        return Result.success(teamRepository.findByLineId(lineId));
    }

    public Result<Team> findById(Long id) {
        Optional<Team> team = teamRepository.findById(id);
        return team.map(Result::success).orElseGet(() -> Result.error("班组不存在"));
    }

    public Result<Team> save(Team team) {
        if (teamRepository.existsByTeamCode(team.getTeamCode())) {
            return Result.error("班组编码已存在");
        }
        Team saved = teamRepository.save(team);
        return Result.success(saved);
    }

    public Result<Team> update(Long id, Team team) {
        Optional<Team> existingOptional = teamRepository.findById(id);
        if (!existingOptional.isPresent()) {
            return Result.error("班组不存在");
        }

        Team existing = existingOptional.get();
        
        if (!existing.getTeamCode().equals(team.getTeamCode()) 
                && teamRepository.existsByTeamCode(team.getTeamCode())) {
            return Result.error("班组编码已存在");
        }

        team.setId(id);
        team.setCreateTime(existing.getCreateTime());
        Team updated = teamRepository.save(team);
        return Result.success(updated);
    }

    public Result<Void> delete(Long id) {
        if (!teamRepository.existsById(id)) {
            return Result.error("班组不存在");
        }
        teamRepository.deleteById(id);
        return Result.success();
    }
}