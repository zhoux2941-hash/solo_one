package com.petboarding.repository;

import com.petboarding.entity.BoardingCenter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BoardingCenterRepository extends JpaRepository<BoardingCenter, Long> {
}
