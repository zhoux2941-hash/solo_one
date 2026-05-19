package com.community.buying.service;

import com.community.buying.entity.Store;
import com.community.buying.repository.StoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StoreService {

    @Autowired
    private StoreRepository storeRepository;

    public Store save(Store store) {
        return storeRepository.save(store);
    }

    public Store findById(Long id) {
        return storeRepository.findById(id).orElse(null);
    }

    public Optional<Store> findByLeaderId(Long leaderId) {
        return storeRepository.findByLeaderId(leaderId);
    }

    public List<Store> findAll() {
        return storeRepository.findAll();
    }

    public List<Store> findByStatus(Integer status) {
        return storeRepository.findByStatus(status);
    }

    public void deleteById(Long id) {
        storeRepository.deleteById(id);
    }

    public Store updateStatus(Long id, Integer status) {
        Store store = findById(id);
        if (store != null) {
            store.setStatus(status);
            return storeRepository.save(store);
        }
        return null;
    }
}