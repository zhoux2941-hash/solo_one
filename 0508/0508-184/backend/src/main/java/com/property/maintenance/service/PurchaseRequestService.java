package com.property.maintenance.service;

import com.property.maintenance.entity.PurchaseRequest;
import com.property.maintenance.entity.SparePart;
import com.property.maintenance.repository.PurchaseRequestRepository;
import com.property.maintenance.repository.SparePartRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PurchaseRequestService {

    @Autowired
    private PurchaseRequestRepository purchaseRequestRepository;

    @Autowired
    private SparePartRepository sparePartRepository;

    @Transactional
    public PurchaseRequest createPurchaseRequest(Long sparePartId, Integer requiredQuantity, String reason) {
        SparePart sparePart = sparePartRepository.findById(sparePartId).orElse(null);
        if (sparePart == null) {
            return null;
        }

        PurchaseRequest request = new PurchaseRequest();
        request.setRequestNo(generateRequestNo());
        request.setSparePartId(sparePartId);
        request.setQuantity(requiredQuantity);
        request.setReason(reason);
        request.setStatus("PENDING");
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());

        return purchaseRequestRepository.save(request);
    }

    @Transactional
    public PurchaseRequest autoCreatePurchaseRequest(Long sparePartId, Integer requiredQuantity) {
        SparePart sparePart = sparePartRepository.findById(sparePartId).orElse(null);
        if (sparePart == null) {
            return null;
        }

        int availableStock = sparePart.getStockQuantity() - sparePart.getLockedQuantity();
        if (availableStock >= requiredQuantity) {
            return null;
        }

        int shortage = requiredQuantity - availableStock;
        int purchaseQuantity = Math.max(shortage, sparePart.getMinStock());

        String reason = String.format("工单创建，备件库存不足。当前可用: %d, 需要: %d", availableStock, requiredQuantity);

        return createPurchaseRequest(sparePartId, purchaseQuantity, reason);
    }

    private String generateRequestNo() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = purchaseRequestRepository.count() + 1;
        return String.format("PR%s%04d", dateStr, count);
    }

    public List<PurchaseRequest> getPendingRequests() {
        return purchaseRequestRepository.findByStatus("PENDING");
    }

    @Transactional
    public PurchaseRequest approveRequest(Long id, Long approverId) {
        PurchaseRequest request = purchaseRequestRepository.findById(id).orElse(null);
        if (request == null) {
            return null;
        }
        request.setStatus("APPROVED");
        request.setApproverId(approverId);
        request.setApprovedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        return purchaseRequestRepository.save(request);
    }

    @Transactional
    public PurchaseRequest rejectRequest(Long id, Long approverId) {
        PurchaseRequest request = purchaseRequestRepository.findById(id).orElse(null);
        if (request == null) {
            return null;
        }
        request.setStatus("REJECTED");
        request.setApproverId(approverId);
        request.setApprovedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        return purchaseRequestRepository.save(request);
    }
}
