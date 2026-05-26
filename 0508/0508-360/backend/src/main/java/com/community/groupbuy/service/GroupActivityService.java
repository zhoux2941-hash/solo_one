package com.community.groupbuy.service;

import com.community.groupbuy.entity.GroupActivity;
import com.community.groupbuy.repository.GroupActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class GroupActivityService {

    @Autowired
    private GroupActivityRepository activityRepository;

    public GroupActivity create(GroupActivity activity) {
        activity.setStatus("ACTIVE");
        if (activity.getStartTime() == null) {
            activity.setStartTime(LocalDateTime.now());
        }
        return activityRepository.save(activity);
    }

    public GroupActivity update(GroupActivity activity) {
        return activityRepository.save(activity);
    }

    public List<GroupActivity> getByLeaderId(Long leaderId) {
        return activityRepository.findByLeaderId(leaderId);
    }

    public List<GroupActivity> getActive() {
        return activityRepository.findByStatus("ACTIVE");
    }

    public GroupActivity getById(Long id) {
        return activityRepository.findById(id).orElse(null);
    }

    public void endActivity(Long id) {
        GroupActivity activity = getById(id);
        if (activity != null) {
            activity.setStatus("ENDED");
            activity.setEndTime(LocalDateTime.now());
            activityRepository.save(activity);
        }
    }
}
