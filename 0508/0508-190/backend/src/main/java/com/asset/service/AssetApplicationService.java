package com.asset.service;

import com.asset.model.ApplicationStatus;
import com.asset.model.Asset;
import com.asset.model.AssetApplication;
import com.asset.model.AssetStatus;
import com.asset.repository.AssetApplicationRepository;
import com.asset.repository.AssetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AssetApplicationService {

    @Autowired
    private AssetApplicationRepository applicationRepository;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private AssetService assetService;

    public List<AssetApplication> getAllApplications() {
        return applicationRepository.findAll();
    }

    public Page<AssetApplication> getAllApplications(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "applicationTime"));
        return applicationRepository.findAll(pageable);
    }

    public Optional<AssetApplication> getApplicationById(Long id) {
        return applicationRepository.findById(id);
    }

    public List<AssetApplication> getApplicationsByStatus(ApplicationStatus status) {
        return applicationRepository.findByStatus(status);
    }

    public Page<AssetApplication> getApplicationsByStatus(ApplicationStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "applicationTime"));
        return applicationRepository.findByStatus(status, pageable);
    }

    @Transactional
    public AssetApplication createApplication(AssetApplication application) {
        Asset asset = assetRepository.findById(application.getAsset().getId())
                .orElseThrow(() -> new RuntimeException("资产不存在"));
        
        if (asset.getStatus() != AssetStatus.IN_STOCK) {
            throw new RuntimeException("该资产不在库中，无法申请");
        }
        
        return applicationRepository.save(application);
    }

    @Transactional
    public AssetApplication approveApplication(Long id, String approver) {
        AssetApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("申请不存在"));
        
        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new RuntimeException("该申请已处理");
        }
        
        Asset asset = application.getAsset();
        if (asset.getStatus() != AssetStatus.IN_STOCK) {
            throw new RuntimeException("该资产已被领用");
        }
        
        assetService.allocateAsset(
                asset.getId(),
                application.getApplicantName(),
                application.getApplicantDepartment(),
                LocalDateTime.now().toLocalDate(),
                application.getExpectedReturnDate()
        );
        
        application.setStatus(ApplicationStatus.APPROVED);
        application.setApprovalTime(LocalDateTime.now());
        application.setApprover(approver);
        
        return applicationRepository.save(application);
    }

    @Transactional
    public AssetApplication rejectApplication(Long id, String approver, String rejectionReason) {
        AssetApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("申请不存在"));
        
        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new RuntimeException("该申请已处理");
        }
        
        application.setStatus(ApplicationStatus.REJECTED);
        application.setApprovalTime(LocalDateTime.now());
        application.setApprover(approver);
        application.setRejectionReason(rejectionReason);
        
        return applicationRepository.save(application);
    }
}
