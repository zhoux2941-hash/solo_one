package com.familytree.service;

import com.familytree.dto.FamilySpaceDTO;
import com.familytree.entity.FamilySpace;
import com.familytree.entity.User;
import com.familytree.repository.FamilySpaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FamilySpaceService {
    @Autowired
    private FamilySpaceRepository familySpaceRepository;

    @Autowired
    private UserService userService;

    public List<FamilySpace> getUserFamilySpaces() {
        User user = userService.getCurrentUser();
        return familySpaceRepository.findByMembersContaining(user);
    }

    public FamilySpace createFamilySpace(FamilySpaceDTO dto) {
        User user = userService.getCurrentUser();
        FamilySpace space = new FamilySpace();
        space.setName(dto.getName());
        space.setDescription(dto.getDescription());
        space.setOwner(user);
        return familySpaceRepository.save(space);
    }

    public FamilySpace updateFamilySpace(Long id, FamilySpaceDTO dto) {
        FamilySpace space = familySpaceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("家族空间不存在"));
        checkOwnership(space);
        space.setName(dto.getName());
        space.setDescription(dto.getDescription());
        return familySpaceRepository.save(space);
    }

    public void deleteFamilySpace(Long id) {
        FamilySpace space = familySpaceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("家族空间不存在"));
        checkOwnership(space);
        familySpaceRepository.delete(space);
    }

    public FamilySpace getFamilySpace(Long id) {
        FamilySpace space = familySpaceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("家族空间不存在"));
        checkMembership(space);
        return space;
    }

    private void checkOwnership(FamilySpace space) {
        User user = userService.getCurrentUser();
        if (!space.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("无权限操作");
        }
    }

    private void checkMembership(FamilySpace space) {
        User user = userService.getCurrentUser();
        if (!space.getMembers().stream().anyMatch(m -> m.getId().equals(user.getId()))) {
            throw new RuntimeException("无权限访问");
        }
    }
}
