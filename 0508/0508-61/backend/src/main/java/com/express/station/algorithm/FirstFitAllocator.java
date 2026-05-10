package com.express.station.algorithm;

import com.express.station.config.StationConfig;
import com.express.station.dto.AllocationResult;
import com.express.station.dto.AllocationResult.ParcelAllocation;
import com.express.station.dto.AllocationResult.ShelfCell;
import com.express.station.entity.Parcel;
import com.express.station.repository.ParcelRepository;
import com.express.station.util.PickupCodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class FirstFitAllocator {

    private final StationConfig stationConfig;
    private final ParcelRepository parcelRepository;
    private final PickupCodeGenerator pickupCodeGenerator;

    public AllocationResult allocate(List<com.express.station.dto.ParcelRequest> requests) {
        String batchId = UUID.randomUUID().toString();
        int rows = stationConfig.getRows();
        int cols = stationConfig.getColumns();
        double cellCapacity = stationConfig.getCellCapacity();

        clearAllExistingAllocations();

        List<ParcelAllocation> parcelAllocations = new ArrayList<>();
        List<ShelfCell> shelfCells = initializeShelfCells(rows, cols, cellCapacity);
        List<String> unallocated = new ArrayList<>();
        double totalVolumeM3 = 0.0;

        for (com.express.station.dto.ParcelRequest req : requests) {
            double volumeCm3 = req.getLength() * req.getWidth() * req.getHeight();
            double volumeM3 = volumeCm3 / 1_000_000.0;
            totalVolumeM3 += volumeM3;

            if (volumeM3 > cellCapacity) {
                unallocated.add(req.getParcelNo());
                parcelAllocations.add(ParcelAllocation.builder()
                    .parcelNo(req.getParcelNo())
                    .volumeCm3(volumeCm3)
                    .volumeM3(volumeM3)
                    .allocated(false)
                    .build());
                continue;
            }

            boolean allocated = false;
            for (ShelfCell cell : shelfCells) {
                if (cell.getRemainingCapacity() >= volumeM3) {
                    String pickupCode = pickupCodeGenerator.generatePickupCode();
                    String cellCode = pickupCodeGenerator.generateCellCode(cell.getRow(), cell.getCol());

                    cell.setUsedCapacity(cell.getUsedCapacity() + volumeM3);
                    cell.setRemainingCapacity(cell.getRemainingCapacity() - volumeM3);
                    cell.setUsageRate(cell.getUsedCapacity() / cellCapacity);
                    cell.getParcelNos().add(req.getParcelNo());

                    parcelAllocations.add(ParcelAllocation.builder()
                        .parcelNo(req.getParcelNo())
                        .volumeCm3(volumeCm3)
                        .volumeM3(volumeM3)
                        .shelfRow(cell.getRow())
                        .shelfCol(cell.getCol())
                        .cellCode(cellCode)
                        .pickupCode(pickupCode)
                        .allocated(true)
                        .pickedUp(false)
                        .build());

                    saveParcel(req, volumeCm3, volumeM3, cell, batchId, pickupCode);
                    allocated = true;
                    break;
                }
            }

            if (!allocated) {
                unallocated.add(req.getParcelNo());
                parcelAllocations.add(ParcelAllocation.builder()
                    .parcelNo(req.getParcelNo())
                    .volumeCm3(volumeCm3)
                    .volumeM3(volumeM3)
                    .allocated(false)
                    .build());
            }
        }

        double totalCapacity = rows * cols * cellCapacity;
        double usedCapacity = shelfCells.stream().mapToDouble(ShelfCell::getUsedCapacity).sum();

        return AllocationResult.builder()
            .batchId(batchId)
            .parcels(parcelAllocations)
            .shelfCells(shelfCells)
            .totalVolumeM3(totalVolumeM3)
            .totalCapacityM3(totalCapacity)
            .utilizationRate(usedCapacity / totalCapacity)
            .success(unallocated.isEmpty())
            .message(unallocated.isEmpty() ? "所有包裹分配成功" : 
                "部分包裹无法分配: " + unallocated.size() + " 个")
            .unallocatedParcels(unallocated)
            .build();
    }

    private List<ShelfCell> initializeShelfCells(int rows, int cols, double cellCapacity) {
        List<ShelfCell> cells = new ArrayList<>();
        for (int row = 1; row <= rows; row++) {
            for (int col = 1; col <= cols; col++) {
                cells.add(ShelfCell.builder()
                    .row(row)
                    .col(col)
                    .usedCapacity(0.0)
                    .remainingCapacity(cellCapacity)
                    .usageRate(0.0)
                    .parcelNos(new ArrayList<>())
                    .build());
            }
        }
        return cells;
    }

    private void loadExistingAllocations(List<ShelfCell> shelfCells, double cellCapacity) {
        List<Parcel> allocatedParcels = parcelRepository.findAllAllocatedParcels();
        
        for (Parcel parcel : allocatedParcels) {
            for (ShelfCell cell : shelfCells) {
                if (cell.getRow() == parcel.getShelfRow() && 
                    cell.getCol() == parcel.getShelfCol()) {
                    cell.setUsedCapacity(cell.getUsedCapacity() + parcel.getVolumeM3());
                    cell.setRemainingCapacity(cell.getRemainingCapacity() - parcel.getVolumeM3());
                    cell.setUsageRate(cell.getUsedCapacity() / cellCapacity);
                    cell.getParcelNos().add(parcel.getParcelNo());
                    break;
                }
            }
        }
    }

    private void saveParcel(com.express.station.dto.ParcelRequest req, 
                           double volumeCm3, double volumeM3, 
                           ShelfCell cell, String batchId, String pickupCode) {
        Parcel parcel = Parcel.builder()
            .parcelNo(req.getParcelNo())
            .length(req.getLength())
            .width(req.getWidth())
            .height(req.getHeight())
            .volumeCm3(volumeCm3)
            .volumeM3(volumeM3)
            .shelfRow(cell.getRow())
            .shelfCol(cell.getCol())
            .allocationBatchId(batchId)
            .pickupCode(pickupCode)
            .pickedUp(false)
            .build();
        parcelRepository.save(parcel);
    }

    public AllocationResult getCurrentAllocationStatus() {
        int rows = stationConfig.getRows();
        int cols = stationConfig.getColumns();
        double cellCapacity = stationConfig.getCellCapacity();

        List<ShelfCell> shelfCells = initializeShelfCells(rows, cols, cellCapacity);
        loadExistingAllocations(shelfCells, cellCapacity);

        double totalCapacity = rows * cols * cellCapacity;
        double usedCapacity = shelfCells.stream().mapToDouble(ShelfCell::getUsedCapacity).sum();

        return AllocationResult.builder()
            .batchId("current")
            .parcels(new ArrayList<>())
            .shelfCells(shelfCells)
            .totalCapacityM3(totalCapacity)
            .utilizationRate(totalCapacity > 0 ? usedCapacity / totalCapacity : 0)
            .success(true)
            .message("当前货架状态")
            .unallocatedParcels(new ArrayList<>())
            .build();
    }

    public void resetShelf() {
        clearAllExistingAllocations();
    }

    private void clearAllExistingAllocations() {
        List<Parcel> parcels = parcelRepository.findAllAllocatedParcels();
        for (Parcel p : parcels) {
            p.setShelfRow(null);
            p.setShelfCol(null);
            p.setAllocationBatchId(null);
        }
        parcelRepository.saveAll(parcels);
    }
}
