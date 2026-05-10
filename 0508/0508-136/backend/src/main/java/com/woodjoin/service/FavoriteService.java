package com.woodjoin.service;

import com.woodjoin.dto.FavoriteDTO;
import com.woodjoin.entity.Favorite;
import com.woodjoin.repository.FavoriteRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;

    @Transactional(readOnly = true)
    public List<FavoriteDTO> getAllFavorites() {
        return favoriteRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public FavoriteDTO createFavorite(FavoriteDTO dto) {
        Favorite favorite = new Favorite();
        updateFromDTO(favorite, dto);
        Favorite saved = favoriteRepository.save(favorite);
        return convertToDTO(saved);
    }

    @Transactional
    public FavoriteDTO updateFavorite(Long id, FavoriteDTO dto) {
        Favorite favorite = favoriteRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("收藏记录不存在: " + id));
        updateFromDTO(favorite, dto);
        Favorite saved = favoriteRepository.save(favorite);
        return convertToDTO(saved);
    }

    @Transactional
    public void deleteFavorite(Long id) {
        if (!favoriteRepository.existsById(id)) {
            throw new EntityNotFoundException("收藏记录不存在: " + id);
        }
        favoriteRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public FavoriteDTO getFavoriteById(Long id) {
        Favorite favorite = favoriteRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("收藏记录不存在: " + id));
        return convertToDTO(favorite);
    }

    private FavoriteDTO convertToDTO(Favorite favorite) {
        FavoriteDTO dto = new FavoriteDTO();
        dto.setId(favorite.getId());
        dto.setName(favorite.getName());
        dto.setJoinType(favorite.getJoinType());
        dto.setWoodLength(favorite.getWoodLength());
        dto.setWoodWidth(favorite.getWoodWidth());
        dto.setWoodHeight(favorite.getWoodHeight());
        dto.setTenonLength(favorite.getTenonLength());
        dto.setTenonWidth(favorite.getTenonWidth());
        dto.setTenonHeight(favorite.getTenonHeight());
        dto.setMargin(favorite.getMargin());
        dto.setDescription(favorite.getDescription());
        return dto;
    }

    private void updateFromDTO(Favorite favorite, FavoriteDTO dto) {
        favorite.setName(dto.getName());
        favorite.setJoinType(dto.getJoinType());
        favorite.setWoodLength(dto.getWoodLength());
        favorite.setWoodWidth(dto.getWoodWidth());
        favorite.setWoodHeight(dto.getWoodHeight());
        favorite.setTenonLength(dto.getTenonLength());
        favorite.setTenonWidth(dto.getTenonWidth());
        favorite.setTenonHeight(dto.getTenonHeight());
        favorite.setMargin(dto.getMargin());
        favorite.setDescription(dto.getDescription());
    }
}