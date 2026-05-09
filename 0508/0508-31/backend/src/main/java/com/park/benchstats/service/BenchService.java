package com.park.benchstats.service;

import com.park.benchstats.entity.Bench;
import com.park.benchstats.repository.BenchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BenchService {
    private final BenchRepository benchRepository;

    @PostConstruct
    public void initBenches() {
        if (benchRepository.count() == 0) {
            Bench[] benches = {
                new Bench(null, "EAST-1", "东区1号长椅", "东区", "朝南"),
                new Bench(null, "EAST-2", "东区2号长椅", "东区", "朝南"),
                new Bench(null, "EAST-3", "东区3号长椅", "东区", "朝东"),
                new Bench(null, "EAST-4", "东区4号长椅", "东区", "朝东"),
                new Bench(null, "WEST-1", "西区1号长椅", "西区", "朝南"),
                new Bench(null, "WEST-2", "西区2号长椅", "西区", "朝南"),
                new Bench(null, "WEST-3", "西区3号长椅", "西区", "朝西"),
                new Bench(null, "WEST-4", "西区4号长椅", "西区", "朝西")
            };
            benchRepository.saveAll(List.of(benches));
            log.info("Initialized 8 benches");
        }
    }

    public List<Bench> getAllBenches() {
        return benchRepository.findAll();
    }

    public List<Bench> getBenchesByArea(String area) {
        return benchRepository.findByArea(area);
    }
}
