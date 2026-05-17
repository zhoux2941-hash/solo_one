package com.airport.lostfound.service;

import com.airport.lostfound.model.FoundItem;
import com.airport.lostfound.model.LostClaim;
import com.airport.lostfound.model.MatchResult;
import com.airport.lostfound.repository.FoundItemRepository;
import com.airport.lostfound.repository.LostClaimRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LostClaimService {

    @Autowired
    private LostClaimRepository lostClaimRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private MatchingService matchingService;

    public LostClaim save(LostClaim lostClaim) {
        return lostClaimRepository.save(lostClaim);
    }

    public List<LostClaim> findAll() {
        return lostClaimRepository.findAll();
    }

    public Optional<LostClaim> findById(Long id) {
        return lostClaimRepository.findById(id);
    }

    public List<LostClaim> findByStatus(String status) {
        return lostClaimRepository.findByStatus(status);
    }

    public List<MatchResult> findMatchesForClaim(Long claimId) {
        Optional<LostClaim> optionalClaim = lostClaimRepository.findById(claimId);
        if (!optionalClaim.isPresent()) {
            return null;
        }

        LostClaim claim = optionalClaim.get();
        List<FoundItem> foundItems = foundItemRepository.findAllUnclaimed();

        return matchingService.findMatches(claim, foundItems);
    }

    public LostClaim updateStatus(Long id, String status) {
        Optional<LostClaim> optional = lostClaimRepository.findById(id);
        if (optional.isPresent()) {
            LostClaim claim = optional.get();
            claim.setStatus(status);
            return lostClaimRepository.save(claim);
        }
        return null;
    }
}
