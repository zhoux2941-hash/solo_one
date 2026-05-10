package com.volunteer.service.impl;

import com.volunteer.entity.Activity;
import com.volunteer.repository.ActivityRepository;
import com.volunteer.service.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class ActivityServiceImpl implements ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Override
    @Transactional
    public Activity create(Activity activity) {
        activity.setStatus("ACTIVE");
        return activityRepository.save(activity);
    }

    @Override
    @Transactional
    public Activity update(Activity activity) {
        return activityRepository.save(activity);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Optional<Activity> activityOpt = activityRepository.findById(id);
        if (activityOpt.isPresent()) {
            Activity activity = activityOpt.get();
            activity.setStatus("CLOSED");
            activityRepository.save(activity);
        }
    }

    @Override
    public Optional<Activity> findById(Long id) {
        return activityRepository.findById(id);
    }

    @Override
    public List<Activity> findActive() {
        return activityRepository.findByStatusOrderByStartTimeDesc("ACTIVE");
    }

    @Override
    public List<Activity> findAll() {
        return activityRepository.findAll();
    }
}
