package com.company.grouporder.controller;

import com.company.grouporder.entity.Merchant;
import com.company.grouporder.entity.MerchantItem;
import com.company.grouporder.service.MerchantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/merchants")
@RequiredArgsConstructor
public class MerchantController {

    private final MerchantService merchantService;

    @GetMapping
    public ResponseEntity<List<Merchant>> getAllMerchants() {
        return ResponseEntity.ok(merchantService.getAllMerchants());
    }

    @GetMapping("/{merchantId}")
    public ResponseEntity<Merchant> getMerchantById(@PathVariable Long merchantId) {
        return merchantService.getMerchantById(merchantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{merchantId}/items")
    public ResponseEntity<List<MerchantItem>> getMerchantItems(@PathVariable Long merchantId) {
        return ResponseEntity.ok(merchantService.getMerchantItems(merchantId));
    }
}
