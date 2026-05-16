package com.skiresort.config;

import com.skiresort.model.Lift;
import com.skiresort.model.Slope;
import com.skiresort.repository.LiftRepository;
import com.skiresort.repository.SlopeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private SlopeRepository slopeRepository;

    @Autowired
    private LiftRepository liftRepository;

    @Override
    public void run(String... args) throws Exception {
        initSlopes();
        initLifts();
    }

    private void initSlopes() {
        if (slopeRepository.count() > 0) {
            return;
        }

        Slope s1 = new Slope();
        s1.setName("初级雪道1号");
        s1.setDifficulty(Slope.DifficultyLevel.BEGINNER);
        s1.setStatus(Slope.SlopeStatus.OPEN);
        s1.setLength(500.0);
        s1.setCapacity(200);
        s1.setMapX(50.0);
        s1.setMapY(100.0);
        s1.setMapWidth(120.0);
        s1.setMapHeight(200.0);
        s1.setVisitorCount(45);
        s1.setLastUpdated(LocalDateTime.now());
        slopeRepository.save(s1);

        Slope s2 = new Slope();
        s2.setName("初级雪道2号");
        s2.setDifficulty(Slope.DifficultyLevel.BEGINNER);
        s2.setStatus(Slope.SlopeStatus.OPEN);
        s2.setLength(600.0);
        s2.setCapacity(250);
        s2.setMapX(200.0);
        s2.setMapY(100.0);
        s2.setMapWidth(100.0);
        s2.setMapHeight(250.0);
        s2.setVisitorCount(62);
        s2.setLastUpdated(LocalDateTime.now());
        slopeRepository.save(s2);

        Slope s3 = new Slope();
        s3.setName("中级雪道1号");
        s3.setDifficulty(Slope.DifficultyLevel.INTERMEDIATE);
        s3.setStatus(Slope.SlopeStatus.OPEN);
        s3.setLength(800.0);
        s3.setCapacity(300);
        s3.setMapX(350.0);
        s3.setMapY(80.0);
        s3.setMapWidth(150.0);
        s3.setMapHeight(300.0);
        s3.setVisitorCount(88);
        s3.setLastUpdated(LocalDateTime.now());
        slopeRepository.save(s3);

        Slope s4 = new Slope();
        s4.setName("中级雪道2号");
        s4.setDifficulty(Slope.DifficultyLevel.INTERMEDIATE);
        s4.setStatus(Slope.SlopeStatus.GROOMING);
        s4.setLength(900.0);
        s4.setCapacity(300);
        s4.setMapX(530.0);
        s4.setMapY(80.0);
        s4.setMapWidth(120.0);
        s4.setMapHeight(280.0);
        s4.setVisitorCount(0);
        s4.setLastUpdated(LocalDateTime.now());
        slopeRepository.save(s4);

        Slope s5 = new Slope();
        s5.setName("高级雪道1号");
        s5.setDifficulty(Slope.DifficultyLevel.ADVANCED);
        s5.setStatus(Slope.SlopeStatus.OPEN);
        s5.setLength(1200.0);
        s5.setCapacity(200);
        s5.setMapX(680.0);
        s5.setMapY(50.0);
        s5.setMapWidth(100.0);
        s5.setMapHeight(350.0);
        s5.setVisitorCount(35);
        s5.setLastUpdated(LocalDateTime.now());
        slopeRepository.save(s5);

        Slope s6 = new Slope();
        s6.setName("高级雪道2号");
        s6.setDifficulty(Slope.DifficultyLevel.ADVANCED);
        s6.setStatus(Slope.SlopeStatus.CLOSED);
        s6.setLength(1500.0);
        s6.setCapacity(150);
        s6.setMapX(810.0);
        s6.setMapY(50.0);
        s6.setMapWidth(100.0);
        s6.setMapHeight(380.0);
        s6.setVisitorCount(0);
        s6.setLastUpdated(LocalDateTime.now());
        slopeRepository.save(s6);
    }

    private void initLifts() {
        if (liftRepository.count() > 0) {
            return;
        }

        Lift l1 = new Lift();
        l1.setName("魔毯A站");
        l1.setType(Lift.LiftType.MAGIC_CARPET);
        l1.setIsActive(true);
        l1.setCapacityPerHour(300);
        l1.setRideTimeMinutes(5);
        l1.setMapX(100.0);
        l1.setMapY(320.0);
        l1.setCurrentQueue(25);
        l1.setLastUpdated(LocalDateTime.now());
        liftRepository.save(l1);

        Lift l2 = new Lift();
        l2.setName("魔毯B站");
        l2.setType(Lift.LiftType.MAGIC_CARPET);
        l2.setIsActive(true);
        l2.setCapacityPerHour(350);
        l2.setRideTimeMinutes(6);
        l2.setMapX(250.0);
        l2.setMapY(370.0);
        l2.setCurrentQueue(18);
        l2.setLastUpdated(LocalDateTime.now());
        liftRepository.save(l2);

        Lift l3 = new Lift();
        l3.setName("1号缆车");
        l3.setType(Lift.LiftType.CHAIRLIFT);
        l3.setIsActive(true);
        l3.setCapacityPerHour(600);
        l3.setRideTimeMinutes(10);
        l3.setMapX(420.0);
        l3.setMapY(400.0);
        l3.setCurrentQueue(45);
        l3.setLastUpdated(LocalDateTime.now());
        liftRepository.save(l3);

        Lift l4 = new Lift();
        l4.setName("2号缆车");
        l4.setType(Lift.LiftType.CHAIRLIFT);
        l4.setIsActive(true);
        l4.setCapacityPerHour(800);
        l4.setRideTimeMinutes(12);
        l4.setMapX(580.0);
        l4.setMapY(380.0);
        l4.setCurrentQueue(68);
        l4.setLastUpdated(LocalDateTime.now());
        liftRepository.save(l4);

        Lift l5 = new Lift();
        l5.setName("高级道缆车");
        l5.setType(Lift.LiftType.GONDOLA);
        l5.setIsActive(true);
        l5.setCapacityPerHour(400);
        l5.setRideTimeMinutes(15);
        l5.setMapX(850.0);
        l5.setMapY(450.0);
        l5.setCurrentQueue(32);
        l5.setLastUpdated(LocalDateTime.now());
        liftRepository.save(l5);
    }
}
