package com.community.buying.repository;

import com.community.buying.entity.DeliveryRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryRouteRepository extends JpaRepository<DeliveryRoute, Long> {
    List<DeliveryRoute> findByStatus(Integer status);
    List<DeliveryRoute> findByDeliveryPersonId(Long deliveryPersonId);
}