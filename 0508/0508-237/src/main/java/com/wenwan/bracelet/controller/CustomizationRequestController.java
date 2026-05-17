package com.wenwan.bracelet.controller;

import com.wenwan.bracelet.entity.CustomizationRequest;
import com.wenwan.bracelet.entity.CustomizationRequest.RequestStatus;
import com.wenwan.bracelet.service.CustomizationRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customization-requests")
@CrossOrigin(origins = "*")
public class CustomizationRequestController {

    @Autowired
    private CustomizationRequestService customizationRequestService;

    @GetMapping
    public ResponseEntity<List<CustomizationRequest>> getAllRequests() {
        return ResponseEntity.ok(customizationRequestService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomizationRequest> getRequestById(@PathVariable Long id) {
        CustomizationRequest request = customizationRequestService.findById(id);
        return request != null ? ResponseEntity.ok(request) : ResponseEntity.notFound().build();
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<CustomizationRequest>> getRequestsByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(customizationRequestService.findByCustomerId(customerId));
    }

    @GetMapping("/craftsman/{craftsmanId}")
    public ResponseEntity<List<CustomizationRequest>> getRequestsByCraftsman(@PathVariable Long craftsmanId) {
        return ResponseEntity.ok(customizationRequestService.findByCraftsmanId(craftsmanId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<CustomizationRequest>> getRequestsByStatus(@PathVariable String status) {
        try {
            RequestStatus requestStatus = RequestStatus.valueOf(status);
            return ResponseEntity.ok(customizationRequestService.findByStatus(requestStatus));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/customer/{customerId}")
    public ResponseEntity<CustomizationRequest> createRequest(@RequestBody CustomizationRequest request, @PathVariable Long customerId) {
        CustomizationRequest newRequest = customizationRequestService.createRequest(request, customerId);
        return newRequest != null ? ResponseEntity.ok(newRequest) : ResponseEntity.badRequest().build();
    }

    @PutMapping("/{id}/assign/{craftsmanId}")
    public ResponseEntity<CustomizationRequest> assignCraftsman(@PathVariable Long id, @PathVariable Long craftsmanId) {
        CustomizationRequest request = customizationRequestService.assignCraftsman(id, craftsmanId);
        return request != null ? ResponseEntity.ok(request) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/status/{status}")
    public ResponseEntity<CustomizationRequest> updateStatus(@PathVariable Long id, @PathVariable String status) {
        try {
            RequestStatus requestStatus = RequestStatus.valueOf(status);
            CustomizationRequest request = customizationRequestService.updateStatus(id, requestStatus);
            return request != null ? ResponseEntity.ok(request) : ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomizationRequest> updateRequest(@PathVariable Long id, @RequestBody CustomizationRequest requestDetails) {
        CustomizationRequest request = customizationRequestService.updateRequest(id, requestDetails);
        return request != null ? ResponseEntity.ok(request) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable Long id) {
        customizationRequestService.deleteRequest(id);
        return ResponseEntity.ok().build();
    }
}
