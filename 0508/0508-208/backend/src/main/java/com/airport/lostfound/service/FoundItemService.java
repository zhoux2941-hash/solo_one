package com.airport.lostfound.service;

import com.airport.lostfound.model.FoundItem;
import com.airport.lostfound.repository.FoundItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FoundItemService {

    @Autowired
    private FoundItemRepository foundItemRepository;

    public FoundItem save(FoundItem foundItem) {
        return foundItemRepository.save(foundItem);
    }

    public List<FoundItem> findAll() {
        return foundItemRepository.findAll();
    }

    public Optional<FoundItem> findById(Long id) {
        return foundItemRepository.findById(id);
    }

    public List<FoundItem> findByStatus(String status) {
        return foundItemRepository.findByStatus(status);
    }

    public List<FoundItem> findAllUnclaimed() {
        return foundItemRepository.findAllUnclaimed();
    }

    public FoundItem updateStatus(Long id, String status) {
        Optional<FoundItem> optional = foundItemRepository.findById(id);
        if (optional.isPresent()) {
            FoundItem item = optional.get();
            item.setStatus(status);
            return foundItemRepository.save(item);
        }
        return null;
    }
}
