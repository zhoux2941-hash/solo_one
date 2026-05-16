package com.property.maintenance.controller;

import com.property.maintenance.entity.PurchaseRequest;
import com.property.maintenance.service.PurchaseRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-requests")
@CrossOrigin(origins = "*")
public class PurchaseRequestController {

    @Autowired
    private PurchaseRequestService purchaseRequestService;

    @GetMapping("/pending")
    public ResponseEntity<List<PurchaseRequest>> getPendingRequests() {
        return ResponseEntity.ok(purchaseRequestService.getPendingRequests());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<PurchaseRequest> approveRequest(@PathVariable Long id, @RequestParam Long approverId) {
        PurchaseRequest request = purchaseRequestService.approveRequest(id, approverId);
        if (request == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(request);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<PurchaseRequest> rejectRequest(@PathVariable Long id, @RequestParam Long approverId) {
        PurchaseRequest request = purchaseRequestService.rejectRequest(id, approverId);
        if (request == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(request);
    }
}
