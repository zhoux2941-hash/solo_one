package com.community.groupbuy.repository;

import com.community.groupbuy.entity.GroupActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupActivityRepository extends JpaRepository<GroupActivity, Long> {
    List<GroupActivity> findByLeaderId(Long leaderId);
    List<GroupActivity> findByStatus(String status);
}
