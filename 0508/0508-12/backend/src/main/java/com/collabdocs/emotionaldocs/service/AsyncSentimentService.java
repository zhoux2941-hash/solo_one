package com.collabdocs.emotionaldocs.service;

import com.collabdocs.emotionaldocs.dto.SentimentResult;
import com.collabdocs.emotionaldocs.entity.Document;
import com.collabdocs.emotionaldocs.entity.SentimentSnapshot;
import com.collabdocs.emotionaldocs.repository.DocumentRepository;
import com.collabdocs.emotionaldocs.repository.SentimentSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AsyncSentimentService {

    private final SentimentAnalysisService sentimentAnalysisService;
    private final SentimentSnapshotRepository sentimentSnapshotRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final RateLimitService rateLimitService;

    @Async("sentimentAnalyzerExecutor")
    @Transactional
    public void analyzeAndSaveSentimentAsync(Long docId, Long userId, Long versionId) {
        log.info("Starting async sentiment analysis for docId: {}, userId: {}, versionId: {}", 
                docId, userId, versionId);

        long startTime = System.currentTimeMillis();

        try {
            if (!rateLimitService.canRequestAnalysis(docId, userId)) {
                long remaining = rateLimitService.getRemainingTime(docId, userId);
                log.info("Rate limit exceeded for doc {} user {}, remaining: {}s", docId, userId, remaining);
                return;
            }

            Optional<Document> docOpt = documentRepository.findById(docId);
            if (docOpt.isEmpty()) {
                log.warn("Document not found for docId: {}", docId);
                return;
            }

            Document document = docOpt.get();
            String content = document.getCurrentContent();

            if (content == null || content.trim().isEmpty()) {
                log.info("Document content is empty, skipping analysis for docId: {}", docId);
                return;
            }

            String username = userRepository.findById(userId)
                    .map(user -> user.getUsername())
                    .orElse("User " + userId);

            SentimentResult result = sentimentAnalysisService.analyzeIncrementalWithUser(
                    docId, userId, username, content);

            SentimentSnapshot snapshot = new SentimentSnapshot();
            snapshot.setDocId(docId);
            snapshot.setUserId(userId);
            snapshot.setSentimentScore(result.getSentimentScore());
            snapshot.setDominantEmotion(result.getDominantEmotion());
            snapshot.setPositiveScore(result.getPositiveScore());
            snapshot.setNegativeScore(result.getNegativeScore());
            snapshot.setNeutralScore(result.getNeutralScore());
            snapshot.setVersionId(versionId);

            sentimentSnapshotRepository.save(snapshot);

            rateLimitService.recordAnalysis(docId, userId);

            long duration = System.currentTimeMillis() - startTime;
            log.info("Incremental sentiment analysis completed for docId: {}, score: {}, emotion: {}, duration: {}ms", 
                    docId, result.getSentimentScore(), result.getDominantEmotion(), duration);

        } catch (Exception e) {
            log.error("Error during async sentiment analysis for docId: {}", docId, e);
        }
    }

    @Async("sentimentAnalyzerExecutor")
    @Transactional
    public void forceAnalyzeAndSaveSentiment(Long docId, Long userId, Long versionId) {
        log.info("Forcing sentiment analysis for docId: {}, userId: {}", docId, userId);

        long startTime = System.currentTimeMillis();

        try {
            Optional<Document> docOpt = documentRepository.findById(docId);
            if (docOpt.isEmpty()) {
                log.warn("Document not found for docId: {}", docId);
                return;
            }

            Document document = docOpt.get();
            String content = document.getCurrentContent();

            if (content == null || content.trim().isEmpty()) {
                log.info("Document content is empty for docId: {}", docId);
                return;
            }

            String username = userRepository.findById(userId)
                    .map(user -> user.getUsername())
                    .orElse("User " + userId);

            SentimentResult result = sentimentAnalysisService.analyzeIncrementalWithUser(
                    docId, userId, username, content);

            SentimentSnapshot snapshot = new SentimentSnapshot();
            snapshot.setDocId(docId);
            snapshot.setUserId(userId);
            snapshot.setSentimentScore(result.getSentimentScore());
            snapshot.setDominantEmotion(result.getDominantEmotion());
            snapshot.setPositiveScore(result.getPositiveScore());
            snapshot.setNegativeScore(result.getNegativeScore());
            snapshot.setNeutralScore(result.getNeutralScore());
            snapshot.setVersionId(versionId);

            sentimentSnapshotRepository.save(snapshot);

            rateLimitService.recordAnalysis(docId, userId);

            long duration = System.currentTimeMillis() - startTime;
            log.info("Forced incremental sentiment analysis completed for docId: {}, score: {}, duration: {}ms", 
                    docId, result.getSentimentScore(), duration);

        } catch (Exception e) {
            log.error("Error during forced sentiment analysis for docId: {}", docId, e);
        }
    }
}
