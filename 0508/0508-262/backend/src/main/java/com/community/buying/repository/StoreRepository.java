package com.community.buying.repository;

import com.community.buying.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {
    List<Store> findByStatus(Integer status);
    Optional<Store> findByLeaderId(Long leaderId);
}