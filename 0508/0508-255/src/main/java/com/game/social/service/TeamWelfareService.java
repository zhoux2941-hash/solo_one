package com.game.social.service;

import com.game.social.entity.TeamWelfare;
import com.game.social.repository.TeamWelfareRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TeamWelfareService {

    @Autowired
    private TeamWelfareRepository teamWelfareRepository;

    public List<TeamWelfare> getTeamWelfares(Long teamId) {
        return teamWelfareRepository.findByTeamId(teamId);
    }

    public List<TeamWelfare> getEnabledTeamWelfares(Long teamId) {
        return teamWelfareRepository.findByTeamIdAndEnabled(teamId, true);
    }

    public TeamWelfare createWelfare(TeamWelfare welfare) {
        welfare.setCreateTime(LocalDateTime.now());
        welfare.setEnabled(true);
        return teamWelfareRepository.save(welfare);
    }

    public TeamWelfare updateWelfare(Long id, TeamWelfare welfareDetails) {
        TeamWelfare welfare = teamWelfareRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Welfare not found"));

        welfare.setWelfareName(welfareDetails.getWelfareName());
        welfare.setWelfareType(welfareDetails.getWelfareType());
        welfare.setDescription(welfareDetails.getDescription());
        welfare.setReward(welfareDetails.getReward());
        return teamWelfareRepository.save(welfare);
    }

    public TeamWelfare toggleWelfareStatus(Long id) {
        TeamWelfare welfare = teamWelfareRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Welfare not found"));

        welfare.setEnabled(!welfare.getEnabled());
        return teamWelfareRepository.save(welfare);
    }

    public void deleteWelfare(Long id) {
        teamWelfareRepository.deleteById(id);
    }
}
