package com.volunteer.service;

import com.volunteer.entity.Activity;
import java.util.List;
import java.util.Optional;

public interface ActivityService {
    Activity create(Activity activity);
    Activity update(Activity activity);
    void delete(Long id);
    Optional<Activity> findById(Long id);
    List<Activity> findActive();
    List<Activity> findAll();
}
