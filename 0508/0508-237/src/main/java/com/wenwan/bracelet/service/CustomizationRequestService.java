package com.wenwan.bracelet.service;

import com.wenwan.bracelet.entity.CustomizationRequest;
import com.wenwan.bracelet.entity.CustomizationRequest.RequestStatus;
import com.wenwan.bracelet.entity.StyleTemplate;
import com.wenwan.bracelet.entity.User;
import com.wenwan.bracelet.repository.CustomizationRequestRepository;
import com.wenwan.bracelet.repository.StyleTemplateRepository;
import com.wenwan.bracelet.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CustomizationRequestService {

    @Autowired
    private CustomizationRequestRepository customizationRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StyleTemplateRepository styleTemplateRepository;

    @Autowired
    private StyleTemplateService styleTemplateService;

    public List<CustomizationRequest> findAll() {
        return customizationRequestRepository.findAll();
    }

    public CustomizationRequest findById(Long id) {
        return customizationRequestRepository.findById(id).orElse(null);
    }

    public List<CustomizationRequest> findByCustomerId(Long customerId) {
        return customizationRequestRepository.findByCustomerId(customerId);
    }

    public List<CustomizationRequest> findByCraftsmanId(Long craftsmanId) {
        return customizationRequestRepository.findByAssignedCraftsmanId(craftsmanId);
    }

    public List<CustomizationRequest> findByStatus(RequestStatus status) {
        return customizationRequestRepository.findByStatus(status);
    }

    public CustomizationRequest createRequest(CustomizationRequest request, Long customerId) {
        User customer = userRepository.findById(customerId).orElse(null);
        if (customer != null) {
            request.setCustomer(customer);
            if (request.getReferenceTemplate() != null && request.getReferenceTemplate().getId() != null) {
                StyleTemplate template = styleTemplateRepository.findById(request.getReferenceTemplate().getId()).orElse(null);
                if (template != null) {
                    request.setReferenceTemplate(template);
                    styleTemplateService.incrementUseCount(template.getId());
                }
            }
            return customizationRequestRepository.save(request);
        }
        return null;
    }

    public CustomizationRequest assignCraftsman(Long requestId, Long craftsmanId) {
        CustomizationRequest request = findById(requestId);
        User craftsman = userRepository.findById(craftsmanId).orElse(null);
        if (request != null && craftsman != null && craftsman.getRole() == User.UserRole.CRAFTSMAN) {
            request.setAssignedCraftsman(craftsman);
            request.setStatus(RequestStatus.ASSIGNED);
            request.setAssignedAt(LocalDateTime.now());
            return customizationRequestRepository.save(request);
        }
        return null;
    }

    public CustomizationRequest updateStatus(Long id, RequestStatus status) {
        CustomizationRequest request = findById(id);
        if (request != null) {
            request.setStatus(status);
            if (status == RequestStatus.COMPLETED) {
                request.setCompletedAt(LocalDateTime.now());
            }
            return customizationRequestRepository.save(request);
        }
        return null;
    }

    public CustomizationRequest updateRequest(Long id, CustomizationRequest requestDetails) {
        CustomizationRequest request = findById(id);
        if (request != null) {
            request.setWearerGender(requestDetails.getWearerGender());
            request.setWristCircumference(requestDetails.getWristCircumference());
            request.setPreferredColors(requestDetails.getPreferredColors());
            request.setAuspiciousMeaning(requestDetails.getAuspiciousMeaning());
            request.setMinBudget(requestDetails.getMinBudget());
            request.setMaxBudget(requestDetails.getMaxBudget());
            request.setUsagePurpose(requestDetails.getUsagePurpose());
            request.setMaterialAvoidance(requestDetails.getMaterialAvoidance());
            request.setCustomerName(requestDetails.getCustomerName());
            request.setCustomerPhone(requestDetails.getCustomerPhone());
            request.setCustomerRemark(requestDetails.getCustomerRemark());
            request.setAdminRemark(requestDetails.getAdminRemark());
            return customizationRequestRepository.save(request);
        }
        return null;
    }

    public void deleteRequest(Long id) {
        customizationRequestRepository.deleteById(id);
    }
}
