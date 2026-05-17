package com.game.social.service;

import com.game.social.entity.TeamActivity;
import com.game.social.repository.TeamActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class TeamActivityService {

    @Autowired
    private TeamActivityRepository teamActivityRepository;

    public List<TeamActivity> getTeamActivities(Long teamId) {
        return teamActivityRepository.findByTeamId(teamId);
    }

    public List<TeamActivity> getTeamActivitiesByDateRange(Long teamId, LocalDate startDate, LocalDate endDate) {
        return teamActivityRepository.findByTeamIdAndActivityDateBetween(teamId, startDate, endDate);
    }

    public TeamActivity recordActivity(Long teamId, Integer activityPoints) {
        LocalDate today = LocalDate.now();
        Optional<TeamActivity> existingActivity = teamActivityRepository.findByTeamIdAndActivityDate(teamId, today);

        TeamActivity activity;
        if (existingActivity.isPresent()) {
            activity = existingActivity.get();
            activity.setTotalActivity(activity.getTotalActivity() + activityPoints);
        } else {
            activity = new TeamActivity();
            activity.setTeamId(teamId);
            activity.setActivityDate(today);
            activity.setTotalActivity(activityPoints);
            activity.setActiveMembers(1);
        }

        return teamActivityRepository.save(activity);
    }

    public TeamActivity updateActiveMembers(Long teamId, Integer activeMembers) {
        LocalDate today = LocalDate.now();
        Optional<TeamActivity> existingActivity = teamActivityRepository.findByTeamIdAndActivityDate(teamId, today);

        TeamActivity activity;
        if (existingActivity.isPresent()) {
            activity = existingActivity.get();
            activity.setActiveMembers(activeMembers);
        } else {
            activity = new TeamActivity();
            activity.setTeamId(teamId);
            activity.setActivityDate(today);
            activity.setActiveMembers(activeMembers);
            activity.setTotalActivity(0);
        }

        return teamActivityRepository.save(activity);
    }
}
