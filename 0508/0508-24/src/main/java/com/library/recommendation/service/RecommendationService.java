package com.library.recommendation.service;

import cn.hutool.core.util.StrUtil;
import com.library.recommendation.entity.Book;
import com.library.recommendation.entity.BorrowRecord;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class RecommendationService {

    private final BorrowRecordService borrowRecordService;
    private final BookService bookService;
    private final InterestVectorService interestVectorService;
    private final DataAnalysisService dataAnalysisService;
    private final CompletionRateService completionRateService;
    private static final double DECAY_RATE = 0.05;
    private static final int NEIGHBOR_COUNT = 10;
    private static final double HIGH_ABANDON_THRESHOLD = 0.5;
    private static final double MEDIUM_ABANDON_THRESHOLD = 0.3;

    public RecommendationService(BorrowRecordService borrowRecordService,
                                BookService bookService,
                                InterestVectorService interestVectorService,
                                DataAnalysisService dataAnalysisService,
                                CompletionRateService completionRateService) {
        this.borrowRecordService = borrowRecordService;
        this.bookService = bookService;
        this.interestVectorService = interestVectorService;
        this.dataAnalysisService = dataAnalysisService;
        this.completionRateService = completionRateService;
    }

    @Data
    public static class RecommendedBook {
        private Book book;
        private double score;
        private List<String> matchReasons;

        public RecommendedBook(Book book, double score) {
            this.book = book;
            this.score = score;
            this.matchReasons = new ArrayList<>();
        }
    }

    @Data
    public static class UserSimilarity {
        private Long userId;
        private double similarity;

        public UserSimilarity(Long userId, double similarity) {
            this.userId = userId;
            this.similarity = similarity;
        }
    }

    public List<RecommendedBook> recommendBooks(Long readerId, int limit) {
        List<BorrowRecord> userRecords = borrowRecordService.findByReaderId(readerId);
        if (userRecords.isEmpty()) {
            return recommendPopularBooks(limit);
        }

        List<Long> borrowedBookIds = borrowRecordService.findBorrowedBookIdsByReaderId(readerId);
        Set<Long> borrowedBookIdSet = new HashSet<>(borrowedBookIds);

        List<RecommendedBook> collaborativeResults = collaborativeFilteringRecommend(readerId, borrowedBookIdSet);
        List<RecommendedBook> contentResults = contentBasedRecommend(readerId, borrowedBookIdSet);
        List<RecommendedBook> trendResults = trendBasedRecommend(readerId, borrowedBookIdSet);

        Map<Long, RecommendedBook> mergedResults = new HashMap<>();

        double collaborativeWeight = 0.4;
        double contentWeight = 0.35;
        double trendWeight = 0.25;

        for (RecommendedBook book : collaborativeResults) {
            RecommendedBook existing = mergedResults.get(book.getBook().getId());
            if (existing == null) {
                existing = new RecommendedBook(book.getBook(), 0);
                mergedResults.put(book.getBook().getId(), existing);
            }
            existing.setScore(existing.getScore() + book.getScore() * collaborativeWeight);
            existing.getMatchReasons().addAll(book.getMatchReasons());
        }

        for (RecommendedBook book : contentResults) {
            RecommendedBook existing = mergedResults.get(book.getBook().getId());
            if (existing == null) {
                existing = new RecommendedBook(book.getBook(), 0);
                mergedResults.put(book.getBook().getId(), existing);
            }
            existing.setScore(existing.getScore() + book.getScore() * contentWeight);
            existing.getMatchReasons().addAll(book.getMatchReasons());
        }

        for (RecommendedBook book : trendResults) {
            RecommendedBook existing = mergedResults.get(book.getBook().getId());
            if (existing == null) {
                existing = new RecommendedBook(book.getBook(), 0);
                mergedResults.put(book.getBook().getId(), existing);
            }
            existing.setScore(existing.getScore() + book.getScore() * trendWeight);
            existing.getMatchReasons().addAll(book.getMatchReasons());
        }

        applyAbandonRatePenalty(readerId, mergedResults);

        return mergedResults.values().stream()
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    private void applyAbandonRatePenalty(Long readerId, Map<Long, RecommendedBook> mergedResults) {
        Map<String, Double> categoryAbandonRates = completionRateService.getCategoryAbandonRates(readerId);

        if (categoryAbandonRates.isEmpty()) {
            return;
        }

        for (RecommendedBook recommended : mergedResults.values()) {
            Book book = recommended.getBook();
            String category = book.getCategory();

            if (StrUtil.isBlank(category)) {
                continue;
            }

            Double abandonRate = categoryAbandonRates.get(category);
            if (abandonRate == null || abandonRate <= 0) {
                continue;
            }

            double penaltyFactor = 1.0;
            String penaltyReason = null;

            if (abandonRate >= HIGH_ABANDON_THRESHOLD) {
                penaltyFactor = 0.2;
                penaltyReason = "高弃读类型(降权80%): " + category;
            } else if (abandonRate >= MEDIUM_ABANDON_THRESHOLD) {
                penaltyFactor = 0.5;
                penaltyReason = "中弃读类型(降权50%): " + category;
            } else {
                penaltyFactor = 1 - abandonRate * 0.5;
                if (abandonRate > 0.1) {
                    penaltyReason = String.format("弃读类型(降权%.0f%%): %s", 
                            (1 - penaltyFactor) * 100, category);
                }
            }

            if (penaltyFactor < 1.0) {
                double originalScore = recommended.getScore();
                recommended.setScore(originalScore * penaltyFactor);
                if (penaltyReason != null) {
                    recommended.getMatchReasons().add(penaltyReason);
                }
            }
        }
    }

    private List<RecommendedBook> collaborativeFilteringRecommend(Long readerId, Set<Long> borrowedBookIdSet) {
        Map<String, Double> currentUserVector = interestVectorService.getInterestVectorMap(readerId);
        
        if (currentUserVector.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> allReaderIds = borrowRecordService.findAllReaderIds();
        
        List<UserSimilarity> similarUsers = allReaderIds.stream()
                .filter(id -> !id.equals(readerId))
                .map(id -> {
                    Map<String, Double> otherVector = interestVectorService.getInterestVectorMap(id);
                    double similarity = calculateCosineSimilarity(currentUserVector, otherVector);
                    return new UserSimilarity(id, similarity);
                })
                .sorted((a, b) -> Double.compare(b.getSimilarity(), a.getSimilarity()))
                .limit(NEIGHBOR_COUNT)
                .collect(Collectors.toList());

        Map<Long, Double> bookScores = new HashMap<>();
        Map<Long, Set<String>> bookReasons = new HashMap<>();

        for (UserSimilarity similarUser : similarUsers) {
            if (similarUser.getSimilarity() <= 0) continue;

            List<Long> similarUserBooks = borrowRecordService.findBorrowedBookIdsByReaderId(similarUser.getUserId());
            for (Long bookId : similarUserBooks) {
                if (borrowedBookIdSet.contains(bookId)) continue;

                double currentScore = bookScores.getOrDefault(bookId, 0.0);
                bookScores.put(bookId, currentScore + similarUser.getSimilarity());

                bookReasons.computeIfAbsent(bookId, k -> new HashSet<>())
                        .add("相似读者推荐");
            }
        }

        List<RecommendedBook> results = new ArrayList<>();
        for (Map.Entry<Long, Double> entry : bookScores.entrySet()) {
            Book book = bookService.getById(entry.getKey());
            if (book != null) {
                RecommendedBook recommended = new RecommendedBook(book, entry.getValue());
                recommended.setMatchReasons(new ArrayList<>(bookReasons.getOrDefault(entry.getKey(), new HashSet<>())));
                results.add(recommended);
            }
        }

        return results;
    }

    private List<RecommendedBook> contentBasedRecommend(Long readerId, Set<Long> borrowedBookIdSet) {
        List<InterestVectorService.TagInterest> interests = interestVectorService.getCurrentInterestVector(readerId);
        
        if (interests.isEmpty()) {
            return Collections.emptyList();
        }

        double maxWeight = interests.isEmpty() ? 1 : interests.get(0).getWeight();
        
        Map<Long, RecommendedBook> bookMap = new HashMap<>();

        for (InterestVectorService.TagInterest interest : interests) {
            double normalizedWeight = interest.getWeight() / maxWeight;
            
            List<Book> tagBooks = bookService.findBooksByTag(interest.getTag());
            for (Book book : tagBooks) {
                if (borrowedBookIdSet.contains(book.getId())) continue;

                RecommendedBook existing = bookMap.get(book.getId());
                if (existing == null) {
                    existing = new RecommendedBook(book, 0);
                    bookMap.put(book.getId(), existing);
                }

                double tagMatchScore = normalizedWeight;
                
                if (StrUtil.isNotBlank(book.getTags())) {
                    String[] bookTags = book.getTags().split(",");
                    for (String tag : bookTags) {
                        if (tag.trim().equals(interest.getTag())) {
                            tagMatchScore += 0.3;
                        }
                    }
                }

                existing.setScore(existing.getScore() + tagMatchScore);
                if (!existing.getMatchReasons().contains("标签匹配: " + interest.getTag())) {
                    existing.getMatchReasons().add("标签匹配: " + interest.getTag());
                }
            }
        }

        return new ArrayList<>(bookMap.values());
    }

    private List<RecommendedBook> trendBasedRecommend(Long readerId, Set<Long> borrowedBookIdSet) {
        List<RecommendedBook> results = new ArrayList<>();
        Set<String> userTags = interestVectorService.getInterestVectorMap(readerId).keySet();
        
        List<DataAnalysisService.TrendingTag> trendingTags = dataAnalysisService.getTrendingTags(20);
        
        for (DataAnalysisService.TrendingTag trendingTag : trendingTags) {
            boolean isUserInterest = userTags.contains(trendingTag.getTag());
            if (isUserInterest || trendingTag.getGrowthRate() > 50) {
                List<Book> books = bookService.findBooksByTag(trendingTag.getTag());
                for (Book book : books) {
                    if (borrowedBookIdSet.contains(book.getId())) continue;

                    double score = (trendingTag.getGrowthRate() / 100.0) * (isUserInterest ? 1.5 : 1.0);
                    RecommendedBook recommended = new RecommendedBook(book, score);
                    
                    List<String> reasons = new ArrayList<>();
                    reasons.add("热门趋势: " + trendingTag.getTag());
                    if (isUserInterest) {
                        reasons.add("符合您的兴趣");
                    }
                    reasons.add("增长 " + String.format("%.1f%%", trendingTag.getGrowthRate()));
                    recommended.setMatchReasons(reasons);
                    
                    results.add(recommended);
                }
            }
        }

        return results;
    }

    private List<RecommendedBook> recommendPopularBooks(int limit) {
        List<Map<String, Object>> topTags = borrowRecordService.findTopTags(10);
        Set<Long> addedBookIds = new HashSet<>();
        List<RecommendedBook> results = new ArrayList<>();

        for (Map<String, Object> tagData : topTags) {
            String tag = (String) tagData.get("tag");
            List<Book> books = bookService.findBooksByTag(tag);
            
            for (Book book : books) {
                if (!addedBookIds.contains(book.getId())) {
                    addedBookIds.add(book.getId());
                    RecommendedBook recommended = new RecommendedBook(book, 1.0);
                    recommended.setMatchReasons(Collections.singletonList("热门推荐"));
                    results.add(recommended);
                    
                    if (results.size() >= limit) {
                        return results;
                    }
                }
            }
        }

        return results;
    }

    private double calculateCosineSimilarity(Map<String, Double> vector1, Map<String, Double> vector2) {
        if (vector1.isEmpty() || vector2.isEmpty()) {
            return 0;
        }

        Set<String> commonKeys = new HashSet<>(vector1.keySet());
        commonKeys.retainAll(vector2.keySet());

        if (commonKeys.isEmpty()) {
            return 0;
        }

        double dotProduct = 0;
        double norm1 = 0;
        double norm2 = 0;

        for (String key : commonKeys) {
            double v1 = vector1.getOrDefault(key, 0.0);
            double v2 = vector2.getOrDefault(key, 0.0);
            dotProduct += v1 * v2;
        }

        for (double v : vector1.values()) {
            norm1 += v * v;
        }

        for (double v : vector2.values()) {
            norm2 += v * v;
        }

        if (norm1 == 0 || norm2 == 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    public Map<String, Object> getRecommendationDetails(Long readerId) {
        Map<String, Object> details = new HashMap<>();
        
        List<InterestVectorService.TagInterest> currentInterests = interestVectorService.getCurrentInterestVector(readerId);
        details.put("currentInterests", currentInterests);
        
        List<BorrowRecord> recentRecords = borrowRecordService.findByReaderId(readerId);
        recentRecords = recentRecords.stream()
                .limit(10)
                .collect(Collectors.toList());
        details.put("recentHistory", recentRecords);
        
        return details;
    }
}
