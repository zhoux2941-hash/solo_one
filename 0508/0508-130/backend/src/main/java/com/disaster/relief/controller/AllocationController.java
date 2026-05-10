package com.disaster.relief.controller;

import com.disaster.relief.common.Result;
import com.disaster.relief.dto.AllocationRequest;
import com.disaster.relief.dto.AllocationResult;
import com.disaster.relief.entity.Warehouse;
import com.disaster.relief.service.AllocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/allocation")
@RequiredArgsConstructor
public class AllocationController {

    private final AllocationService allocationService;

    @PostMapping("/calculate")
    public Result<AllocationResult> calculateAllocation(@RequestBody AllocationRequest request) {
        AllocationResult result = allocationService.allocate(request);
        return Result.success(result);
    }

    @GetMapping("/warehouses")
    public Result<List<Warehouse>> getWarehouses() {
        return Result.success(allocationService.getWarehouses());
    }
}
