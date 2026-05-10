package com.festival.volunteer.service;

import com.festival.volunteer.dto.PositionRequest;
import com.festival.volunteer.entity.Position;
import com.festival.volunteer.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PositionService {

    private final PositionRepository positionRepository;

    public List<Position> getAllPositions() {
        return positionRepository.findAll();
    }

    public List<Position> getActivePositions() {
        return positionRepository.findByStatus(Position.PositionStatus.ACTIVE);
    }

    public Position getPositionById(Long id) {
        return positionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("岗位不存在"));
    }

    @Transactional
    public Position createPosition(PositionRequest request) {
        Position position = new Position();
        position.setName(request.getName());
        position.setDescription(request.getDescription());
        position.setType(request.getType());
        position.setRequiredCount(request.getRequiredCount());
        position.setLocation(request.getLocation());
        position.setCurrentCount(0);
        position.setStatus(Position.PositionStatus.ACTIVE);

        return positionRepository.save(position);
    }

    @Transactional
    public Position updatePosition(Long id, PositionRequest request) {
        Position position = getPositionById(id);
        position.setName(request.getName());
        position.setDescription(request.getDescription());
        position.setType(request.getType());
        position.setRequiredCount(request.getRequiredCount());
        position.setLocation(request.getLocation());

        updatePositionStatus(position);
        return positionRepository.save(position);
    }

    @Transactional
    public void deletePosition(Long id) {
        Position position = getPositionById(id);
        position.setStatus(Position.PositionStatus.INACTIVE);
        positionRepository.save(position);
    }

    @Transactional
    public void updatePositionStatus(Position position) {
        if (position.getCurrentCount() >= position.getRequiredCount()) {
            position.setStatus(Position.PositionStatus.FULL);
        } else if (position.getStatus() == Position.PositionStatus.FULL 
                   && position.getCurrentCount() < position.getRequiredCount()) {
            position.setStatus(Position.PositionStatus.ACTIVE);
        }
    }

    @Transactional
    public void incrementCurrentCount(Long positionId) {
        Position position = getPositionById(positionId);
        position.setCurrentCount(position.getCurrentCount() + 1);
        updatePositionStatus(position);
        positionRepository.save(position);
    }

    @Transactional
    public void decrementCurrentCount(Long positionId) {
        Position position = getPositionById(positionId);
        if (position.getCurrentCount() > 0) {
            position.setCurrentCount(position.getCurrentCount() - 1);
        }
        updatePositionStatus(position);
        positionRepository.save(position);
    }
}
