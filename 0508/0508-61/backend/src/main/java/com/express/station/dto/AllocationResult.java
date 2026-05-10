package com.express.station.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllocationResult implements Serializable {
    
    private static final long serialVersionUID = 1L;

    private String batchId;
    private List<ParcelAllocation> parcels;
    private List<ShelfCell> shelfCells;
    private double totalVolumeM3;
    private double totalCapacityM3;
    private double utilizationRate;
    private boolean success;
    private String message;
    private List<String> unallocatedParcels;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParcelAllocation implements Serializable {
        private static final long serialVersionUID = 1L;
        private String parcelNo;
        private double volumeCm3;
        private double volumeM3;
        private Integer shelfRow;
        private Integer shelfCol;
        private String cellCode;
        private String pickupCode;
        private boolean allocated;
        private boolean pickedUp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShelfCell implements Serializable {
        private static final long serialVersionUID = 1L;
        private int row;
        private int col;
        private double usedCapacity;
        private double remainingCapacity;
        private double usageRate;
        private List<String> parcelNos;
    }
}
