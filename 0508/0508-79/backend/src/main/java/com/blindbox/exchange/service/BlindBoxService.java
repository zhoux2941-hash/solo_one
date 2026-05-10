package com.blindbox.exchange.service;

import com.blindbox.exchange.dto.BlindBoxRequest;
import com.blindbox.exchange.dto.PageResponse;
import com.blindbox.exchange.entity.BlindBox;
import com.blindbox.exchange.entity.User;
import com.blindbox.exchange.repository.BlindBoxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BlindBoxService {

    private final BlindBoxRepository blindBoxRepository;
    private final BrowseHistoryService browseHistoryService;

    @Transactional
    public BlindBox createBlindBox(User user, BlindBoxRequest request) {
        BlindBox blindBox = new BlindBox();
        blindBox.setUser(user);
        blindBox.setModelNumber(request.getModelNumber());
        blindBox.setSeriesName(request.getSeriesName());
        blindBox.setStyleName(request.getStyleName());
        blindBox.setImageUrl(request.getImageUrl());
        blindBox.setCondition(request.getCondition());
        blindBox.setDescription(request.getDescription());
        blindBox.setIsAvailable(true);
        return blindBoxRepository.save(blindBox);
    }

    @Transactional
    public BlindBox updateBlindBox(Long userId, Long boxId, BlindBoxRequest request) {
        BlindBox blindBox = blindBoxRepository.findById(boxId)
                .orElseThrow(() -> new RuntimeException("盲盒不存在"));
        if (!blindBox.getUser().getId().equals(userId)) {
            throw new RuntimeException("无权修改此盲盒");
        }
        blindBox.setModelNumber(request.getModelNumber());
        blindBox.setSeriesName(request.getSeriesName());
        blindBox.setStyleName(request.getStyleName());
        blindBox.setImageUrl(request.getImageUrl());
        blindBox.setCondition(request.getCondition());
        blindBox.setDescription(request.getDescription());
        return blindBoxRepository.save(blindBox);
    }

    @Transactional
    public void deleteBlindBox(Long userId, Long boxId) {
        BlindBox blindBox = blindBoxRepository.findById(boxId)
                .orElseThrow(() -> new RuntimeException("盲盒不存在"));
        if (!blindBox.getUser().getId().equals(userId)) {
            throw new RuntimeException("无权删除此盲盒");
        }
        blindBoxRepository.delete(blindBox);
    }

    public List<BlindBox> getUserBoxes(Long userId) {
        return blindBoxRepository.findByUserId(userId);
    }

    public List<BlindBox> getUserAvailableBoxes(Long userId) {
        return blindBoxRepository.findByUserIdAndIsAvailable(userId, true);
    }

    public BlindBox getBoxById(Long boxId, Long viewerId) {
        BlindBox box = blindBoxRepository.findById(boxId)
                .orElseThrow(() -> new RuntimeException("盲盒不存在"));
        if (viewerId != null && !box.getUser().getId().equals(viewerId)) {
            browseHistoryService.addToHistory(viewerId, boxId);
        }
        return box;
    }

    public PageResponse<BlindBox> searchBoxes(String seriesName, String styleName, Long excludeUserId, 
                                               int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<BlindBox> boxes = blindBoxRepository.searchAvailableBoxes(
                seriesName != null && !seriesName.isEmpty() ? seriesName : null,
                styleName != null && !styleName.isEmpty() ? styleName : null,
                excludeUserId,
                pageable
        );
        return PageResponse.from(boxes);
    }

    public PageResponse<BlindBox> getAllAvailableBoxes(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<BlindBox> boxes = blindBoxRepository.findAllAvailableForUser(userId, pageable);
        return PageResponse.from(boxes);
    }

    public List<String> getAllSeries() {
        return blindBoxRepository.findAllAvailableSeries();
    }

    public void setAvailable(Long boxId, boolean available) {
        BlindBox box = blindBoxRepository.findById(boxId)
                .orElseThrow(() -> new RuntimeException("盲盒不存在"));
        box.setIsAvailable(available);
        blindBoxRepository.save(box);
    }
}
