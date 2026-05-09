package com.logistics.track.service;

import com.logistics.track.dto.PackageDTO;
import com.logistics.track.entity.Package;
import com.logistics.track.entity.Track;
import com.logistics.track.entity.TrackStatus;
import com.logistics.track.repository.PackageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PackageService {

    private final PackageRepository packageRepository;
    private final TrackService trackService;

    @Transactional
    public Package createPackage(Package pkg, Track initialTrack) {
        if (packageRepository.existsByPackageNo(pkg.getPackageNo())) {
            throw new RuntimeException("包裹单号已存在: " + pkg.getPackageNo());
        }
        
        pkg.setCurrentStatus(TrackStatus.PICKUP);
        Package saved = packageRepository.save(pkg);
        
        initialTrack.setPackageId(saved.getPackageId());
        initialTrack.setStatus(TrackStatus.PICKUP);
        trackService.addTrack(saved.getPackageId(), initialTrack);
        
        return saved;
    }

    public PackageDTO getPackageById(Long packageId) {
        Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new RuntimeException("包裹不存在: " + packageId));
        return convertToDTO(pkg);
    }

    public PackageDTO getPackageByNo(String packageNo) {
        Package pkg = packageRepository.findByPackageNo(packageNo)
                .orElseThrow(() -> new RuntimeException("包裹不存在: " + packageNo));
        return convertToDTO(pkg);
    }

    public List<PackageDTO> getAllPackages() {
        return packageRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public Package updateStatus(Long packageId, TrackStatus status) {
        Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new RuntimeException("包裹不存在: " + packageId));
        
        pkg.setCurrentStatus(status);
        return packageRepository.save(pkg);
    }

    private PackageDTO convertToDTO(Package pkg) {
        PackageDTO dto = new PackageDTO();
        dto.setPackageId(pkg.getPackageId());
        dto.setPackageNo(pkg.getPackageNo());
        dto.setSender(pkg.getSender());
        dto.setSenderCity(pkg.getSenderCity());
        dto.setReceiver(pkg.getReceiver());
        dto.setReceiverCity(pkg.getReceiverCity());
        dto.setCreatedAt(pkg.getCreatedAt());
        dto.setCurrentStatus(pkg.getCurrentStatus());
        dto.setCurrentStatusDescription(pkg.getCurrentStatus().getDescription());
        return dto;
    }
}
