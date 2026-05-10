package com.example.lostfound.task;

import com.example.lostfound.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MatchScheduledTask {

    private final MatchingService matchingService;

    @Scheduled(cron = "0 0 2 * * ?")
    public void executeDailyMatching() {
        matchingService.runDailyMatching();
    }
}
