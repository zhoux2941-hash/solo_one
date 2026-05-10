package com.express.station.service;

import com.express.station.algorithm.FirstFitAllocator;
import com.express.station.dto.AllocationResult;
import com.express.station.dto.ParcelRequest;
import com.express.station.entity.Parcel;
import com.express.station.repository.ParcelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ParcelService {

    private final FirstFitAllocator allocator;
    private final ParcelRepository parcelRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String ALLOCATION_CACHE_PREFIX = "allocation:";
    private static final long CACHE_TTL_MINUTES = 30;

    public AllocationResult allocateParcels(List<ParcelRequest> requests) {
        AllocationResult result = allocator.allocate(requests);
        if (result.isSuccess()) {
            cacheAllocationResult(result);
        }
        return result;
    }

    public AllocationResult getAllocationByBatchId(String batchId) {
        String cacheKey = ALLOCATION_CACHE_PREFIX + batchId;
        
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof AllocationResult) {
            return (AllocationResult) cached;
        }
        
        return null;
    }

    public AllocationResult getCurrentShelfStatus() {
        String cacheKey = ALLOCATION_CACHE_PREFIX + "current";
        
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof AllocationResult) {
            return (AllocationResult) cached;
        }

        AllocationResult status = allocator.getCurrentAllocationStatus();
        redisTemplate.opsForValue().set(cacheKey, status, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        return status;
    }

    public void resetShelf() {
        allocator.resetShelf();
        redisTemplate.delete(ALLOCATION_CACHE_PREFIX + "current");
    }

    public List<Parcel> getAllParcels() {
        return parcelRepository.findAll();
    }

    public List<Parcel> getPickupList() {
        return parcelRepository.findAllAllocatedParcels();
    }

    public Optional<Parcel> getParcelByNo(String parcelNo) {
        return parcelRepository.findByParcelNo(parcelNo);
    }

    public Map<String, Object> pickupByCode(String pickupCode) {
        Map<String, Object> result = new HashMap<>();
        
        Optional<Parcel> optParcel = parcelRepository.findByPickupCode(pickupCode);
        
        if (optParcel.isEmpty()) {
            result.put("success", false);
            result.put("message", "取件码不存在");
            return result;
        }

        Parcel parcel = optParcel.get();
        
        if (Boolean.TRUE.equals(parcel.getPickedUp())) {
            result.put("success", false);
            result.put("message", "该包裹已被取走");
            result.put("pickedUpAt", parcel.getPickedUpAt());
            return result;
        }

        parcel.setPickedUp(true);
        parcel.setPickedUpAt(LocalDateTime.now());
        parcelRepository.save(parcel);

        result.put("success", true);
        result.put("message", "取件成功！包裹 " + parcel.getParcelNo() + " 已被取走");
        result.put("parcelNo", parcel.getParcelNo());
        result.put("cellCode", parcel.getShelfRow() + "-" + String.format("%02d", parcel.getShelfCol()));
        result.put("volumeM3", parcel.getVolumeM3());
        result.put("freedSpace", parcel.getVolumeM3());

        redisTemplate.delete(ALLOCATION_CACHE_PREFIX + "current");

        return result;
    }

    public void deleteParcel(Long id) {
        parcelRepository.deleteById(id);
    }

    private void cacheAllocationResult(AllocationResult result) {
        String cacheKey = ALLOCATION_CACHE_PREFIX + result.getBatchId();
        redisTemplate.opsForValue().set(cacheKey, result, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        redisTemplate.opsForValue().set(ALLOCATION_CACHE_PREFIX + "current", 
            allocator.getCurrentAllocationStatus(), CACHE_TTL_MINUTES, TimeUnit.MINUTES);
    }
}
