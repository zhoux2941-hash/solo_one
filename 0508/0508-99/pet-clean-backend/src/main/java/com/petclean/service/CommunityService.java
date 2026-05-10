package com.petclean.service;

import com.petclean.entity.Community;
import com.petclean.repository.CommunityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityRepository communityRepository;

    public Optional<Community> getCommunityStats() {
        return communityRepository.findById(1L);
    }

    public int getCleanliness() {
        return communityRepository.findById(1L)
                .map(Community::getTotalCleanliness)
                .orElse(0);
    }
}
