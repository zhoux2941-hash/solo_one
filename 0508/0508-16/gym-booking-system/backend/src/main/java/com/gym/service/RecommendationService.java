package com.gym.service;

import com.gym.dto.RecommendationDTO;
import com.gym.dto.UserPreference;
import com.gym.entity.Course;
import com.gym.repository.BookingRepository;
import com.gym.repository.CourseRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class RecommendationService {
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private RedisCacheService redisCacheService;
    
    private static final int TOP_SIMILAR_USERS = 5;
    private static final int TOP_RECOMMENDATIONS = 10;
    private static final double MIN_SIMILARITY = 0.3;
    
    public List<RecommendationDTO> getRecommendations(Long userId, int limit) {
        log.info("开始为用户 {} 生成推荐", userId);
        
        UserPreference userPref = buildUserPreference(userId);
        
        if (userPref.getCourseTypeWeights().isEmpty() && userPref.getCoachWeights().isEmpty()) {
            log.info("用户 {} 没有历史数据，返回热门推荐");
            return getPopularRecommendations(userId, limit);
        }
        
        List<Long> allUserIds = bookingRepository.getAllUserIds();
        
        Map<Long, Double> userSimilarities = new HashMap<>();
        
        for (Long otherUserId : allUserIds) {
            if (otherUserId.equals(userId)) continue;
            
            UserPreference otherPref = buildUserPreference(otherUserId);
            
            double similarity = calculateCosineSimilarity(userPref, otherPref);
            
            if (similarity > MIN_SIMILARITY) {
                userSimilarities.put(otherUserId, similarity);
            }
        }
        
        List<Map.Entry<Long, Double>> topSimilarUsers = userSimilarities.entrySet().stream()
            .sorted(Map.Entry.<Long, Double>comparingByValue(Comparator.reverseOrder()))
            .limit(TOP_SIMILAR_USERS)
            .collect(Collectors.toList());
        
        log.info("找到 {} 个相似用户", topSimilarUsers.size());
        
        if (topSimilarUsers.isEmpty()) {
            log.info("没有找到足够相似的用户，返回热门推荐");
            return getPopularRecommendations(userId, limit);
        }
        
        Set<Long> userBookedCourseIds = getUserBookedCourseIds(userId);
        
        Map<Long, RecommendationScore> courseScores = new HashMap<>();
        
        List<Course> upcomingCourses = courseRepository.findByStartTimeAfterOrderByStartTimeAsc(LocalDateTime.now());
        
        for (Course course : upcomingCourses) {
            if (userBookedCourseIds.contains(course.getCourseId())) continue;
            
            RecommendationScore score = calculateRecommendationScore(
                course, 
                userPref, 
                topSimilarUsers
            );
            
            if (score.totalScore > 0) {
                courseScores.put(course.getCourseId(), score);
            }
        }
        
        List<RecommendationDTO> recommendations = courseScores.entrySet().stream()
            .sorted(Map.Entry.<Long, RecommendationScore>comparingByValue(
                Comparator.comparingDouble(s -> s.totalScore)
                .reversed())
            .limit(limit)
            .map(entry -> {
                RecommendationScore score = entry.getValue();
                return buildRecommendationDTO(score.course, score);
            })
            .collect(Collectors.toList());
        
        log.info("为用户 {} 生成了 {} 条推荐", userId, recommendations.size());
        
        if (recommendations.isEmpty()) {
            return getPopularRecommendations(userId, limit);
        }
        
        return recommendations;
    }
    
    private UserPreference buildUserPreference(Long userId) {
        UserPreference preference = UserPreference.create(userId);
        
        List<Object[]> coursePrefs = bookingRepository.getUserCoursePreferences(userId);
        for (Object[] row : coursePrefs) {
            String courseName = (String) row[1];
            long totalBookings = ((Number) row[2]).longValue();
            long checkins = ((Number) row[3]).longValue();
            double weight = checkins * 2.0 + (totalBookings - checkins) * 0.5;
            preference.addCourseType(courseName, weight);
        }
        
        List<Object[]> coachPrefs = bookingRepository.getUserCoachPreferences(userId);
        for (Object[] row : coachPrefs) {
            Long coachId = ((Number) row[1]).longValue();
            long totalBookings = ((Number) row[3]).longValue();
            long checkins = ((Number) row[4]).longValue();
            double weight = checkins * 2.0 + (totalBookings - checkins) * 0.5;
            preference.addCoach(coachId, weight);
        }
        
        preference.normalize();
        
        return preference;
    }
    
    private double calculateCosineSimilarity(UserPreference pref1, UserPreference pref2) {
        if (pref1.getCourseTypeWeights().isEmpty() || pref2.getCourseTypeWeights().isEmpty()) {
            return 0.0;
        }
        
        Set<String> allCourseTypes = new HashSet<>();
        allCourseTypes.addAll(pref1.getCourseTypeWeights().keySet());
        allCourseTypes.addAll(pref2.getCourseTypeWeights().keySet());
        
        Set<Long> allCoaches = new HashSet<>();
        allCoaches.addAll(pref1.getCoachWeights().keySet());
        allCoaches.addAll(pref2.getCoachWeights().keySet());
        
        double dotProduct = 0.0;
        double magnitude1 = 0.0;
        double magnitude2 = 0.0;
        
        for (String courseType : allCourseTypes) {
            double w1 = pref1.getCourseTypeWeights().getOrDefault(courseType, 0.0);
            double w2 = pref2.getCourseTypeWeights().getOrDefault(courseType, 0.0);
            dotProduct += w1 * w2;
            magnitude1 += w1 * w1;
            magnitude2 += w2 * w2;
        }
        
        for (Long coachId : allCoaches) {
            double w1 = pref1.getCoachWeights().getOrDefault(coachId, 0.0);
            double w2 = pref2.getCoachWeights().getOrDefault(coachId, 0.0);
            dotProduct += w1 * w2 * 1.5;
            magnitude1 += w1 * w1;
            magnitude2 += w2 * w2;
        }
        
        if (magnitude1 == 0 || magnitude2 == 0) {
            return 0.0;
        }
        
        return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
    }
    
    private Set<Long> getUserBookedCourseIds(Long userId) {
        Set<Long> courseIds = new HashSet<>();
        List<Object[]> bookedCourses = bookingRepository.getUserBookedCourses(userId);
        for (Object[] row : bookedCourses) {
            courseIds.add(((Number) row[1]).longValue());
        }
        return courseIds;
    }
    
    private RecommendationScore calculateRecommendationScore(
            Course course,
            UserPreference userPref,
            List<Map.Entry<Long, Double>> similarUsers) {
        
        RecommendationScore score = new RecommendationScore();
        score.course = course;
        
        String courseType = extractCourseType(course.getName());
        
        if (userPref.getCourseTypeWeights().containsKey(courseType)) {
            score.courseTypeScore = userPref.getCourseTypeWeights().get(courseType) * 0.4;
            score.reasons.add("您喜欢" + courseType + "类型的课程");
        }
        
        if (userPref.getCoachWeights().containsKey(course.getCoachId())) {
            score.coachScore = userPref.getCoachWeights().get(course.getCoachId()) * 0.3;
            score.reasons.add("您喜欢" + course.getCoachName() + "教练的课程");
        }
        
        for (Map.Entry<Long, Double> entry : similarUsers) {
            Long similarUserId = entry.getKey();
            double similarity = entry.getValue();
            
            UserPreference similarPref = buildUserPreference(similarUserId);
            
            String similarCourseType = extractCourseType(course.getName());
            if (similarPref.getCourseTypeWeights().containsKey(similarCourseType)) {
                double weight = similarPref.getCourseTypeWeights().get(similarCourseType);
                score.similarUserScore += similarity * weight * 0.3;
                score.similarUserReason = "与您兴趣相似的会员也喜欢这门课";
            }
        }
        
        score.totalScore = score.courseTypeScore + score.coachScore + score.similarUserScore;
        
        return score;
    }
    
    private String extractCourseType(String courseName) {
        if (courseName.contains("瑜伽")) return "瑜伽";
        if (courseName.contains("单车") || courseName.contains("动感")) return "动感单车";
        if (courseName.contains("普拉提")) return "普拉提";
        if (courseName.contains("HIIT")) return "HIIT";
        if (courseName.contains("有氧")) return "有氧";
        if (courseName.contains("力量")) return "力量";
        if (courseName.contains("舞蹈")) return "舞蹈";
        if (courseName.contains("游泳")) return "游泳";
        return courseName;
    }
    
    private RecommendationDTO buildRecommendationDTO(Course course, RecommendationScore score) {
        int remaining = redisCacheService.getRemainingCapacity(course.getCourseId(), course.getCapacity());
        
        String reason = String.join("；", score.reasons);
        if (score.similarUserReason != null && !score.reasons.contains(score.similarUserReason)) {
            reason = reason.isEmpty() ? score.similarUserReason : reason + "；" + score.similarUserReason;
        }
        if (reason.isEmpty()) {
            reason = "热门课程推荐";
        }
        
        return RecommendationDTO.builder()
            .courseId(course.getCourseId())
            .courseName(course.getName())
            .coachId(course.getCoachId())
            .coachName(course.getCoachName())
            .startTime(course.getStartTime())
            .endTime(course.getEndTime())
            .capacity(course.getCapacity())
            .remaining(remaining)
            .description(course.getDescription())
            .score(Math.round(score.totalScore * 100.0) / 100.0)
            .reason(reason)
            .similarityScore(score.similarUserScore)
            .similarUserReason(score.similarUserReason)
            .build();
    }
    
    private List<RecommendationDTO> getPopularRecommendations(Long userId, int limit) {
        List<Course> upcomingCourses = courseRepository.findByStartTimeAfterOrderByStartTimeAsc(LocalDateTime.now());
        Set<Long> userBookedCourseIds = getUserBookedCourseIds(userId);
        
        return upcomingCourses.stream()
            .filter(course -> !userBookedCourseIds.contains(course.getCourseId()))
            .limit(limit)
            .map(course -> {
                int remaining = redisCacheService.getRemainingCapacity(course.getCourseId(), course.getCapacity());
                return RecommendationDTO.builder()
                    .courseId(course.getCourseId())
                    .courseName(course.getName())
                    .coachId(course.getCoachId())
                    .coachName(course.getCoachName())
                    .startTime(course.getStartTime())
                    .endTime(course.getEndTime())
                    .capacity(course.getCapacity())
                    .remaining(remaining)
                    .description(course.getDescription())
                    .score(0.5)
                    .reason("热门课程推荐")
                    .build();
            })
            .collect(Collectors.toList());
    }
    
    private static class RecommendationScore {
        Course course;
        double courseTypeScore;
        double coachScore;
        double similarUserScore;
        double totalScore;
        List<String> reasons = new ArrayList<>();
        String similarUserReason;
    }
}
