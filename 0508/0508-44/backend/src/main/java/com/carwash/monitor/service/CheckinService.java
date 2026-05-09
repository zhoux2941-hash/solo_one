package com.carwash.monitor.service;

import com.carwash.monitor.dto.CheckinRecordDTO;
import com.carwash.monitor.dto.CheckinRequestDTO;
import com.carwash.monitor.dto.CheckinResponseDTO;
import com.carwash.monitor.dto.LeaderboardDTO;
import com.carwash.monitor.entity.CheckinRecord;
import com.carwash.monitor.entity.Employee;
import com.carwash.monitor.repository.CheckinRecordRepository;
import com.carwash.monitor.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CheckinService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private CheckinRecordRepository checkinRecordRepository;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Autowired
    private TeamService teamService;

    private static final String LEADERBOARD_KEY_PREFIX = "checkin:leaderboard:week:";
    private static final double SUCCESS_THRESHOLD = 0.7;
    private static final int BASE_POINTS = 10;
    private static final int INACTIVE_DAYS_THRESHOLD = 30;

    private static final List<String> PLATE_KEYWORDS = Arrays.asList(
            "光盘", "plate", "empty", "clean", "吃完", "吃光", "空盘", "finish", "done", "clear"
    );

    private static final List<String> NOT_PLATE_KEYWORDS = Arrays.asList(
            "剩饭", "剩菜", "浪费", "leftover", "waste", "没吃完", "half"
    );

    @Transactional
    public CheckinResponseDTO checkin(CheckinRequestDTO request) {
        CheckinResponseDTO response = new CheckinResponseDTO();

        Employee employee = employeeRepository.findByEmployeeNo(request.getEmployeeNo())
                .orElseThrow(() -> new RuntimeException("员工不存在"));

        LocalDate today = LocalDate.now();
        Optional<CheckinRecord> existingRecord = checkinRecordRepository
                .findByEmployeeIdAndCheckinDate(employee.getId(), today);

        if (existingRecord.isPresent()) {
            response.setMessage("今日已打卡");
            response.setIsSuccess(existingRecord.get().getIsSuccess());
            response.setPointsEarned(existingRecord.get().getPointsEarned());
            response.setConsecutiveDays(existingRecord.get().getConsecutiveDays());
            response.setPlateProbability(existingRecord.get().getPlateProbability());
            return response;
        }

        double plateProbability = simulateImageAnalysis(request.getImageBase64(), request.getFileName());
        boolean isSuccess = plateProbability >= SUCCESS_THRESHOLD;

        int consecutiveDays = calculateConsecutiveDays(employee.getId(), isSuccess);

        int pointsEarned = 0;
        if (isSuccess) {
            pointsEarned = calculatePoints(consecutiveDays);
            employee.setTotalPoints(employee.getTotalPoints() + pointsEarned);
            employeeRepository.save(employee);

            updateLeaderboard(employee, pointsEarned);
            teamService.updateTeamContribution(employee.getId(), pointsEarned);
        }

        CheckinRecord record = new CheckinRecord();
        record.setEmployeeId(employee.getId());
        record.setCheckinDate(today);
        record.setIsSuccess(isSuccess);
        record.setPointsEarned(pointsEarned);
        record.setPlateProbability(plateProbability);
        record.setConsecutiveDays(consecutiveDays);
        checkinRecordRepository.save(record);

        response.setIsSuccess(isSuccess);
        response.setPlateProbability(plateProbability);
        response.setPointsEarned(pointsEarned);
        response.setConsecutiveDays(consecutiveDays);
        response.setMessage(isSuccess ? "打卡成功！" : "打卡失败，光盘概率不足");

        return response;
    }

    private double simulateImageAnalysis(String imageBase64, String fileName) {
        double baseProbability = 0.7;

        List<String> positiveFactors = new ArrayList<>();
        List<String> negativeFactors = new ArrayList<>();

        if (imageBase64 != null && !imageBase64.isEmpty()) {
            int length = imageBase64.length();

            if (length > 10000) {
                positiveFactors.add("大图片");
                baseProbability += 0.05;
            } else if (length > 5000) {
                positiveFactors.add("中等图片");
                baseProbability += 0.02;
            } else {
                negativeFactors.add("小图片");
                baseProbability -= 0.03;
            }

            int hash = Math.abs(imageBase64.hashCode());
            if (hash % 3 == 0) {
                positiveFactors.add("哈希特征");
                baseProbability += 0.03;
            } else if (hash % 3 == 1) {
                negativeFactors.add("哈希特征");
                baseProbability -= 0.02;
            }
        }

        if (fileName != null && !fileName.isEmpty()) {
            String lowerFileName = fileName.toLowerCase();

            for (String keyword : PLATE_KEYWORDS) {
                if (lowerFileName.contains(keyword.toLowerCase())) {
                    positiveFactors.add("文件名包含:" + keyword);
                    baseProbability += 0.08;
                    break;
                }
            }

            for (String keyword : NOT_PLATE_KEYWORDS) {
                if (lowerFileName.contains(keyword.toLowerCase())) {
                    negativeFactors.add("文件名包含:" + keyword);
                    baseProbability -= 0.15;
                    break;
                }
            }
        }

        Random random = new Random();
        double randomFactor = (random.nextDouble() - 0.5) * 0.2;
        baseProbability += randomFactor;

        if (baseProbability > 0.95) {
            baseProbability = 0.95;
        } else if (baseProbability < 0.2) {
            baseProbability = 0.2;
        }

        return Math.round(baseProbability * 1000.0) / 1000.0;
    }

    private int calculateConsecutiveDays(Long employeeId, boolean todaySuccess) {
        if (!todaySuccess) {
            return 0;
        }

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        Optional<CheckinRecord> yesterdayRecord = checkinRecordRepository
                .findByEmployeeIdAndCheckinDate(employeeId, yesterday);

        if (yesterdayRecord.isPresent() && yesterdayRecord.get().getIsSuccess()) {
            return yesterdayRecord.get().getConsecutiveDays() + 1;
        }

        return 1;
    }

    private int calculatePoints(int consecutiveDays) {
        int points = BASE_POINTS;

        if (consecutiveDays > 1) {
            int bonus = Math.min(consecutiveDays - 1, 5);
            points += bonus;
        }

        return points;
    }

    private String getWeeklyLeaderboardKey() {
        LocalDate now = LocalDate.now();
        WeekFields weekFields = WeekFields.of(DayOfWeek.MONDAY, 4);
        int weekNumber = now.get(weekFields.weekOfWeekBasedYear());
        int year = now.get(weekFields.weekBasedYear());
        return LEADERBOARD_KEY_PREFIX + year + "_" + weekNumber;
    }

    private LocalDate getWeekStartDate() {
        return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private void updateLeaderboard(Employee employee, int points) {
        String leaderboardKey = getWeeklyLeaderboardKey();
        String member = employee.getId() + ":" + employee.getEmployeeNo() + ":" + employee.getName() + ":" + employee.getDepartment();
        redisTemplate.opsForZSet().incrementScore(leaderboardKey, member, points);
    }

    public List<LeaderboardDTO> getWeeklyLeaderboard() {
        String leaderboardKey = getWeeklyLeaderboardKey();
        LocalDate weekStart = getWeekStartDate();

        Set<String> topMembers = redisTemplate.opsForZSet()
                .reverseRange(leaderboardKey, 0, 99);

        if (topMembers == null || topMembers.isEmpty()) {
            return calculateLeaderboardFromDB();
        }

        List<LeaderboardDTO> leaderboard = new ArrayList<>();
        int rank = 1;

        for (String member : topMembers) {
            String[] parts = member.split(":");
            Long employeeId = Long.parseLong(parts[0]);
            Double score = redisTemplate.opsForZSet().score(leaderboardKey, member);

            if (isEmployeeActive(employeeId, weekStart)) {
                LeaderboardDTO dto = new LeaderboardDTO();
                dto.setRank(rank++);
                dto.setEmployeeNo(parts[1]);
                dto.setName(parts[2]);
                dto.setDepartment(parts[3]);
                dto.setPoints(score != null ? score.intValue() : 0);

                leaderboard.add(dto);

                if (leaderboard.size() >= 10) {
                    break;
                }
            }
        }

        return leaderboard;
    }

    private boolean isEmployeeActive(Long employeeId, LocalDate weekStart) {
        List<CheckinRecord> recentRecords = checkinRecordRepository
                .findByEmployeeIdOrderByCheckinDateDesc(employeeId);

        if (recentRecords.isEmpty()) {
            return false;
        }

        for (CheckinRecord record : recentRecords) {
            if (!record.getCheckinDate().isBefore(weekStart)) {
                return true;
            }
        }

        CheckinRecord latestRecord = recentRecords.get(0);
        LocalDate latestDate = latestRecord.getCheckinDate();
        long daysInactive = java.time.temporal.ChronoUnit.DAYS.between(latestDate, LocalDate.now());

        return daysInactive <= INACTIVE_DAYS_THRESHOLD;
    }

    private List<LeaderboardDTO> calculateLeaderboardFromDB() {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(6);

        List<CheckinRecord> records = checkinRecordRepository
                .findWeeklySuccessfulCheckins(weekStart, weekEnd);

        Map<Long, Integer> pointsMap = new HashMap<>();
        for (CheckinRecord record : records) {
            pointsMap.merge(record.getEmployeeId(), record.getPointsEarned(), Integer::sum);
        }

        List<Map.Entry<Long, Integer>> sortedEntries = pointsMap.entrySet().stream()
                .sorted(Map.Entry.<Long, Integer>comparingByValue().reversed())
                .collect(Collectors.toList());

        List<LeaderboardDTO> leaderboard = new ArrayList<>();
        int rank = 1;
        String leaderboardKey = getWeeklyLeaderboardKey();

        for (Map.Entry<Long, Integer> entry : sortedEntries) {
            if (leaderboard.size() >= 10) {
                break;
            }

            if (!isEmployeeActive(entry.getKey(), weekStart)) {
                continue;
            }

            Employee employee = employeeRepository.findById(entry.getKey()).orElse(null);
            if (employee != null) {
                LeaderboardDTO dto = new LeaderboardDTO();
                dto.setRank(rank++);
                dto.setEmployeeNo(employee.getEmployeeNo());
                dto.setName(employee.getName());
                dto.setDepartment(employee.getDepartment());
                dto.setPoints(entry.getValue());
                leaderboard.add(dto);

                String member = employee.getId() + ":" + employee.getEmployeeNo() + ":" + employee.getName() + ":" + employee.getDepartment();
                redisTemplate.opsForZSet().add(leaderboardKey, member, entry.getValue());
            }
        }

        return leaderboard;
    }

    public Employee getEmployeeInfo(String employeeNo) {
        return employeeRepository.findByEmployeeNo(employeeNo)
                .orElseThrow(() -> new RuntimeException("员工不存在"));
    }

    public List<CheckinRecordDTO> getCheckinRecords(String employeeNo) {
        Employee employee = employeeRepository.findByEmployeeNo(employeeNo)
                .orElseThrow(() -> new RuntimeException("员工不存在"));

        List<CheckinRecord> records = checkinRecordRepository
                .findByEmployeeIdOrderByCheckinDateDesc(employee.getId());

        return records.stream().map(record -> {
            CheckinRecordDTO dto = new CheckinRecordDTO();
            dto.setCheckinDate(record.getCheckinDate());
            dto.setIsSuccess(record.getIsSuccess());
            dto.setPointsEarned(record.getPointsEarned());
            dto.setPlateProbability(record.getPlateProbability());
            dto.setConsecutiveDays(record.getConsecutiveDays());
            return dto;
        }).collect(Collectors.toList());
    }
}
