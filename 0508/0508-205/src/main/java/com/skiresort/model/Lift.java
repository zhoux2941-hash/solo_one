package com.skiresort.model;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "lifts")
public class Lift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private LiftType type;

    @Column(nullable = false)
    private Boolean isActive = true;

    private Integer capacityPerHour;

    private Integer rideTimeMinutes;

    @Column(name = "map_x")
    private Double mapX;

    @Column(name = "map_y")
    private Double mapY;

    @Column(name = "current_queue")
    private Integer currentQueue = 0;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    public enum LiftType {
        MAGIC_CARPET("魔毯"),
        CHAIRLIFT("缆车"),
        GONDOLA("吊箱"),
        T_BAR("T型杆");

        private final String displayName;

        LiftType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public Integer getEstimatedWaitTimeMinutes() {
        if (capacityPerHour == null || capacityPerHour == 0) {
            return 0;
        }
        double peoplePerMinute = capacityPerHour / 60.0;
        return (int) Math.ceil(currentQueue / peoplePerMinute);
    }
}
