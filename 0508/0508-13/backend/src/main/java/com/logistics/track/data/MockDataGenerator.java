package com.logistics.track.data;

import com.logistics.track.entity.Package;
import com.logistics.track.entity.Track;
import com.logistics.track.entity.TrackStatus;
import com.logistics.track.repository.PackageRepository;
import com.logistics.track.repository.TrackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Component
@RequiredArgsConstructor
@Slf4j
public class MockDataGenerator implements CommandLineRunner {

    private final PackageRepository packageRepository;
    private final TrackRepository trackRepository;

    private static final String[] SENDERS = {"张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十"};
    private static final String[] RECEIVERS = {"陈一", "林二", "黄三", "杨四", "刘五", "何六", "高七", "罗八"};

    @Override
    public void run(String... args) throws Exception {
        if (packageRepository.count() > 0) {
            log.info("数据库已有数据，跳过模拟数据生成");
            return;
        }
        
        log.info("开始生成模拟数据...");
        generateMockData();
        log.info("模拟数据生成完成");
    }

    public void generateMockData() {
        List<CityCenterConfig> centers = CityCenterConfig.getAllCenters();
        Random random = new Random();
        
        for (int i = 0; i < 50; i++) {
            String packageNo = "SF" + String.format("%012d", System.currentTimeMillis() + i);
            
            CityCenterConfig fromCenter = centers.get(random.nextInt(centers.size()));
            CityCenterConfig toCenter = centers.get(random.nextInt(centers.size()));
            
            while (fromCenter == toCenter) {
                toCenter = centers.get(random.nextInt(centers.size()));
            }
            
            Package pkg = Package.builder()
                    .packageNo(packageNo)
                    .sender(SENDERS[random.nextInt(SENDERS.length)])
                    .senderCity(fromCenter.getCityName())
                    .receiver(RECEIVERS[random.nextInt(RECEIVERS.length)])
                    .receiverCity(toCenter.getCityName())
                    .build();
            
            packageRepository.save(pkg);
            
            generatePackageTracks(pkg, fromCenter, toCenter, random);
        }
    }

    private void generatePackageTracks(Package pkg, CityCenterConfig fromCenter, 
                                       CityCenterConfig toCenter, Random random) {
        
        List<CityCenterConfig> transitCenters = generateTransitRoute(fromCenter, toCenter, random);
        
        LocalDateTime currentTime = LocalDateTime.now().minusDays(7 + random.nextInt(7));
        
        Track pickupTrack = Track.builder()
                .packageId(pkg.getPackageId())
                .location(fromCenter.getCenterName())
                .status(TrackStatus.PICKUP)
                .timestamp(currentTime)
                .latitude(fromCenter.getLatitude())
                .longitude(fromCenter.getLongitude())
                .remark("快递员已揽收")
                .build();
        trackRepository.save(pickupTrack);
        
        currentTime = currentTime.plusHours(2 + random.nextInt(4));
        
        for (int i = 0; i < transitCenters.size(); i++) {
            CityCenterConfig transit = transitCenters.get(i);
            boolean isLastTransit = i == transitCenters.size() - 1;
            
            Track transitTrack = Track.builder()
                    .packageId(pkg.getPackageId())
                    .location(transit.getCenterName())
                    .status(TrackStatus.IN_TRANSIT)
                    .timestamp(currentTime)
                    .latitude(transit.getLatitude())
                    .longitude(transit.getLongitude())
                    .remark("已到达" + transit.getCityName() + "转运中心")
                    .build();
            trackRepository.save(transitTrack);
            
            currentTime = currentTime.plusHours(12 + random.nextInt(24));
        }
        
        Track dispatchTrack = Track.builder()
                .packageId(pkg.getPackageId())
                .location(toCenter.getCenterName())
                .status(TrackStatus.DISPATCH)
                .timestamp(currentTime)
                .latitude(toCenter.getLatitude())
                .longitude(toCenter.getLongitude())
                .remark("快递员正在派送")
                .build();
        trackRepository.save(dispatchTrack);
        
        currentTime = currentTime.plusHours(2 + random.nextInt(6));
        
        Track signedTrack = Track.builder()
                .packageId(pkg.getPackageId())
                .location(toCenter.getCenterName())
                .status(TrackStatus.SIGNED)
                .timestamp(currentTime)
                .latitude(toCenter.getLatitude())
                .longitude(toCenter.getLongitude())
                .remark("已签收")
                .build();
        trackRepository.save(signedTrack);
        
        pkg.setCurrentStatus(TrackStatus.SIGNED);
        packageRepository.save(pkg);
    }

    private List<CityCenterConfig> generateTransitRoute(CityCenterConfig from, CityCenterConfig to, Random random) {
        List<CityCenterConfig> centers = new ArrayList<>(CityCenterConfig.getAllCenters());
        centers.remove(from);
        centers.remove(to);
        Collections.shuffle(centers, random);
        
        int transitCount = random.nextInt(3) + 1;
        return centers.subList(0, Math.min(transitCount, centers.size()));
    }
}
