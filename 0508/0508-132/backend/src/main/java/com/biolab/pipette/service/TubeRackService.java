package com.biolab.pipette.service;

import com.biolab.pipette.dto.TubeRackDTO;
import com.biolab.pipette.dto.WellPositionDTO;
import com.biolab.pipette.model.ReagentType;
import com.biolab.pipette.model.TubeRack;
import com.biolab.pipette.model.WellPosition;
import com.biolab.pipette.repository.TubeRackRepository;
import com.biolab.pipette.repository.WellPositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TubeRackService {

    private final TubeRackRepository tubeRackRepository;
    private final WellPositionRepository wellPositionRepository;

    @Transactional
    public TubeRackDTO createTubeRack(TubeRackDTO dto) {
        TubeRack rack = TubeRack.builder()
                .name(dto.getName() != null ? dto.getName() : "默认试管架")
                .rows(dto.getRows() != null ? dto.getRows() : 6)
                .columns(dto.getColumns() != null ? dto.getColumns() : 8)
                .build();

        TubeRack savedRack = tubeRackRepository.save(rack);
        List<WellPositionDTO> wells = initializeWells(savedRack.getId(), savedRack.getRows(), savedRack.getColumns());

        return convertToDTO(savedRack, wells);
    }

    @Transactional
    public List<WellPositionDTO> initializeWells(Long tubeRackId, int rows, int columns) {
        List<WellPosition> wells = new ArrayList<>();
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < columns; c++) {
                wells.add(WellPosition.builder()
                        .tubeRackId(tubeRackId)
                        .rowNum(r)
                        .colNum(c)
                        .reagentType(ReagentType.EMPTY)
                        .label(String.format("%c%d", (char) ('A' + r), c + 1))
                        .build());
            }
        }
        wellPositionRepository.saveAll(wells);
        return wells.stream().map(this::convertToWellDTO).collect(Collectors.toList());
    }

    @Cacheable(value = "tubeRacks", key = "#id")
    public Optional<TubeRackDTO> getTubeRackById(Long id) {
        return tubeRackRepository.findById(id)
                .map(rack -> {
                    List<WellPosition> wells = wellPositionRepository.findByTubeRackIdOrderByRowNumAscColNumAsc(id);
                    return convertToDTO(rack, wells.stream().map(this::convertToWellDTO).collect(Collectors.toList()));
                });
    }

    @Cacheable(value = "allTubeRacks")
    public List<TubeRackDTO> getAllTubeRacks() {
        return tubeRackRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(rack -> {
                    List<WellPosition> wells = wellPositionRepository.findByTubeRackIdOrderByRowNumAscColNumAsc(rack.getId());
                    return convertToDTO(rack, wells.stream().map(this::convertToWellDTO).collect(Collectors.toList()));
                })
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = {"tubeRacks", "allTubeRacks"}, allEntries = true)
    public Optional<WellPositionDTO> updateWellPosition(Long tubeRackId, Integer row, Integer col, WellPositionDTO dto) {
        Optional<WellPosition> wellOpt = wellPositionRepository.findByTubeRackIdAndRowNumAndColNum(tubeRackId, row, col);
        if (wellOpt.isEmpty()) {
            return Optional.empty();
        }

        WellPosition well = wellOpt.get();
        if (dto.getReagentType() != null) {
            well.setReagentType(ReagentType.fromCode(dto.getReagentType()));
        }
        if (dto.getLabel() != null) {
            well.setLabel(dto.getLabel());
        }
        if (dto.getNotes() != null) {
            well.setNotes(dto.getNotes());
        }

        WellPosition saved = wellPositionRepository.save(well);
        return Optional.of(convertToWellDTO(saved));
    }

    @Transactional
    @CacheEvict(value = {"tubeRacks", "allTubeRacks"}, allEntries = true)
    public List<WellPositionDTO> updateMultipleWells(Long tubeRackId, List<WellPositionDTO> wellUpdates) {
        List<WellPositionDTO> updated = new ArrayList<>();
        for (WellPositionDTO dto : wellUpdates) {
            Optional<WellPosition> wellOpt = wellPositionRepository.findByTubeRackIdAndRowNumAndColNum(
                    tubeRackId, dto.getRowNum(), dto.getColNum());
            
            if (wellOpt.isPresent()) {
                WellPosition well = wellOpt.get();
                if (dto.getReagentType() != null) {
                    well.setReagentType(ReagentType.fromCode(dto.getReagentType()));
                }
                if (dto.getLabel() != null) {
                    well.setLabel(dto.getLabel());
                }
                if (dto.getNotes() != null) {
                    well.setNotes(dto.getNotes());
                }
                WellPosition saved = wellPositionRepository.save(well);
                updated.add(convertToWellDTO(saved));
            }
        }
        return updated;
    }

    @Transactional
    @CacheEvict(value = {"tubeRacks", "allTubeRacks"}, allEntries = true)
    public boolean deleteTubeRack(Long id) {
        if (!tubeRackRepository.existsById(id)) {
            return false;
        }
        wellPositionRepository.deleteByTubeRackId(id);
        tubeRackRepository.deleteById(id);
        return true;
    }

    public Optional<WellPositionDTO> getWellById(Long wellId) {
        return wellPositionRepository.findById(wellId).map(this::convertToWellDTO);
    }

    public Optional<WellPositionDTO> getWellByPosition(Long tubeRackId, Integer row, Integer col) {
        return wellPositionRepository.findByTubeRackIdAndRowNumAndColNum(tubeRackId, row, col)
                .map(this::convertToWellDTO);
    }

    private TubeRackDTO convertToDTO(TubeRack rack, List<WellPositionDTO> wells) {
        return TubeRackDTO.builder()
                .id(rack.getId())
                .name(rack.getName())
                .rows(rack.getRows())
                .columns(rack.getColumns())
                .wells(wells)
                .createdAt(rack.getCreatedAt())
                .updatedAt(rack.getUpdatedAt())
                .build();
    }

    private WellPositionDTO convertToWellDTO(WellPosition well) {
        ReagentType type = well.getReagentType();
        return WellPositionDTO.builder()
                .id(well.getId())
                .tubeRackId(well.getTubeRackId())
                .rowNum(well.getRowNum())
                .colNum(well.getColNum())
                .reagentType(type.getCode())
                .reagentTypeName(type.getDisplayName())
                .label(well.getLabel())
                .notes(well.getNotes())
                .build();
    }
}