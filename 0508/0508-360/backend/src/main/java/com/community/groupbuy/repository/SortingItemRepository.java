package com.community.groupbuy.repository;

import com.community.groupbuy.entity.SortingItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SortingItemRepository extends JpaRepository<SortingItem, Long> {
    List<SortingItem> findByActivityId(Long activityId);
    Optional<SortingItem> findByActivityIdAndProductId(Long activityId, Long productId);
}
