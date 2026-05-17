package com.wenwan.bracelet.service;

import com.wenwan.bracelet.entity.PricingScheme;
import com.wenwan.bracelet.entity.User;
import com.wenwan.bracelet.repository.PricingSchemeRepository;
import com.wenwan.bracelet.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PricingSchemeService {

    @Autowired
    private PricingSchemeRepository pricingSchemeRepository;

    @Autowired
    private UserRepository userRepository;

    public List<PricingScheme> findByCraftsmanId(Long craftsmanId) {
        return pricingSchemeRepository.findByCraftsmanId(craftsmanId);
    }

    public PricingScheme findById(Long id) {
        return pricingSchemeRepository.findById(id).orElse(null);
    }

    public PricingScheme findDefaultByCraftsmanId(Long craftsmanId) {
        return pricingSchemeRepository.findByCraftsmanIdAndIsDefaultTrue(craftsmanId).orElse(null);
    }

    public PricingScheme createPricingScheme(PricingScheme pricingScheme, Long craftsmanId) {
        User craftsman = userRepository.findById(craftsmanId).orElse(null);
        if (craftsman != null && craftsman.getRole() == User.UserRole.CRAFTSMAN) {
            pricingScheme.setCraftsman(craftsman);
            if (pricingScheme.getDefault() == null) {
                pricingScheme.setDefault(false);
            }
            return pricingSchemeRepository.save(pricingScheme);
        }
        return null;
    }

    public PricingScheme updatePricingScheme(Long id, PricingScheme pricingSchemeDetails) {
        PricingScheme pricingScheme = findById(id);
        if (pricingScheme != null) {
            pricingScheme.setName(pricingSchemeDetails.getName());
            pricingScheme.setType(pricingSchemeDetails.getType());
            pricingScheme.setBasePrice(pricingSchemeDetails.getBasePrice());
            pricingScheme.setLaborCostPercentage(pricingSchemeDetails.getLaborCostPercentage());
            pricingScheme.setFixedLaborCost(pricingSchemeDetails.getFixedLaborCost());
            pricingScheme.setDescription(pricingSchemeDetails.getDescription());
            pricingScheme.setDefault(pricingSchemeDetails.getDefault());
            return pricingSchemeRepository.save(pricingScheme);
        }
        return null;
    }

    public void deletePricingScheme(Long id) {
        pricingSchemeRepository.deleteById(id);
    }

    public PricingScheme setDefault(Long craftsmanId, Long pricingSchemeId) {
        List<PricingScheme> schemes = findByCraftsmanId(craftsmanId);
        for (PricingScheme scheme : schemes) {
            scheme.setDefault(scheme.getId().equals(pricingSchemeId));
            pricingSchemeRepository.save(scheme);
        }
        return findById(pricingSchemeId);
    }
}