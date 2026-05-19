package com.community.buying.service;

import com.community.buying.entity.DeliveryRoute;
import com.community.buying.repository.DeliveryRouteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliveryRouteService {

    @Autowired
    private DeliveryRouteRepository deliveryRouteRepository;

    public DeliveryRoute save(DeliveryRoute route) {
        return deliveryRouteRepository.save(route);
    }

    public DeliveryRoute findById(Long id) {
        return deliveryRouteRepository.findById(id).orElse(null);
    }

    public List<DeliveryRoute> findAll() {
        return deliveryRouteRepository.findAll();
    }

    public List<DeliveryRoute> findByStatus(Integer status) {
        return deliveryRouteRepository.findByStatus(status);
    }

    public List<DeliveryRoute> findByDeliveryPersonId(Long deliveryPersonId) {
        return deliveryRouteRepository.findByDeliveryPersonId(deliveryPersonId);
    }

    public void deleteById(Long id) {
        deliveryRouteRepository.deleteById(id);
    }
}