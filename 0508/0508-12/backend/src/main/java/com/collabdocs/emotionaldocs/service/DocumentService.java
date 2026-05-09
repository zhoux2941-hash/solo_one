package com.collabdocs.emotionaldocs.service;

import com.collabdocs.emotionaldocs.dto.*;
import com.collabdocs.emotionaldocs.entity.*;
import com.collabdocs.emotionaldocs.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final ActionLogRepository actionLogRepository;
    private final SentimentSnapshotRepository sentimentSnapshotRepository;
    private final UserRepository userRepository;
    private final SentimentAnalysisService sentimentAnalysisService;
    private final AsyncSentimentService asyncSentimentService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Document createDocument(String title, Long userId, String initialContent) {
        Document document = new Document();
        document.setTitle(title);
        document.setCreatedBy(userId);
        document.setLastModifiedBy(userId);
        document.setCurrentContent(initialContent != null ? initialContent : "");
        
        Document saved = documentRepository.save(document);
        
        saveVersion(saved.getId(), userId, initialContent != null ? initialContent : "");
        logAction(saved.getId(), userId, ActionLog.ActionType.INSERT, null, 0, 0);
        
        return saved;
    }

    @Transactional
    public Document updateDocumentContent(Long docId, Long userId, String content, boolean isSave) {
        Optional<Document> docOpt = documentRepository.findById(docId);
        if (docOpt.isEmpty()) {
            throw new RuntimeException("Document not found: " + docId);
        }

        Document document = docOpt.get();
        document.setCurrentContent(content);
        document.setLastModifiedBy(userId);
        
        Document saved = documentRepository.save(document);
        
        if (isSave) {
            DocumentVersion version = saveVersion(docId, userId, content);
            logAction(docId, userId, ActionLog.ActionType.SAVE, null, 0, 0);
            asyncSentimentService.forceAnalyzeAndSaveSentiment(docId, userId, version.getVersionId());
        } else {
            asyncSentimentService.analyzeAndSaveSentimentAsync(docId, userId, null);
        }

        broadcastDocumentUpdate(docId, userId, content);
        
        return saved;
    }

    @Transactional
    public void logUserAction(Long docId, Long userId, ActionLog.ActionType actionType, 
                              String selectedText, Integer posStart, Integer posEnd) {
        logAction(docId, userId, actionType, selectedText, posStart, posEnd);
    }

    @Transactional(readOnly = true)
    public Document getDocument(Long docId) {
        return documentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + docId));
    }

    @Transactional(readOnly = true)
    public List<Document> getUserDocuments(Long userId) {
        return documentRepository.findByCreatedByOrderByUpdatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public SentimentHistoryResponse getSentimentHistory(Long docId) {
        List<SentimentSnapshot> snapshots = sentimentSnapshotRepository.findByDocIdOrderByTimestampAsc(docId);
        
        Map<Long, List<SentimentSnapshot>> groupedByUser = snapshots.stream()
                .collect(Collectors.groupingBy(SentimentSnapshot::getUserId));
        
        List<SentimentHistoryResponse.UserSentimentSeries> series = new ArrayList<>();
        
        for (Map.Entry<Long, List<SentimentSnapshot>> entry : groupedByUser.entrySet()) {
            Long userId = entry.getKey();
            Optional<User> userOpt = userRepository.findById(userId);
            
            String username = userOpt.map(User::getUsername).orElse("User " + userId);
            String color = userOpt.map(User::getColor).orElse(getDefaultColor(userId));
            
            List<SentimentHistoryResponse.SentimentPoint> points = entry.getValue().stream()
                    .map(s -> SentimentHistoryResponse.SentimentPoint.builder()
                            .timestamp(s.getTimestamp())
                            .score(s.getSentimentScore())
                            .emotion(s.getDominantEmotion().name())
                            .build())
                    .collect(Collectors.toList());
            
            series.add(SentimentHistoryResponse.UserSentimentSeries.builder()
                    .userId(userId)
                    .username(username)
                    .color(color)
                    .points(points)
                    .build());
        }
        
        return SentimentHistoryResponse.builder()
                .docId(docId)
                .series(series)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ParagraphSentiment> getParagraphSentiment(Long docId) {
        Document document = getDocument(docId);
        return sentimentAnalysisService.analyzeParagraphsIncremental(docId, document.getCurrentContent());
    }

    @Transactional(readOnly = true)
    public WordCloudData getWordCloudData(Long docId) {
        Document document = getDocument(docId);
        return sentimentAnalysisService.extractWordCloud(document.getCurrentContent());
    }

    @Transactional(readOnly = true)
    public List<DocumentVersion> getDocumentVersions(Long docId) {
        return documentVersionRepository.findByDocIdOrderByVersionNumberDesc(docId);
    }

    @Transactional(readOnly = true)
    public List<ActionLog> getActionLogs(Long docId) {
        return actionLogRepository.findByDocIdOrderByTimestampDesc(docId);
    }

    private DocumentVersion saveVersion(Long docId, Long userId, String content) {
        Integer maxVersion = documentVersionRepository.findMaxVersionNumberByDocId(docId)
                .orElse(0);
        
        DocumentVersion version = new DocumentVersion();
        version.setDocId(docId);
        version.setUserId(userId);
        version.setContent(content);
        version.setVersionNumber(maxVersion + 1);
        
        return documentVersionRepository.save(version);
    }

    private void logAction(Long docId, Long userId, ActionLog.ActionType actionType, 
                          String selectedText, Integer posStart, Integer posEnd) {
        ActionLog log = new ActionLog();
        log.setDocId(docId);
        log.setUserId(userId);
        log.setActionType(actionType);
        log.setSelectedText(selectedText);
        log.setPositionStart(posStart);
        log.setPositionEnd(posEnd);
        
        actionLogRepository.save(log);
    }

    private void broadcastDocumentUpdate(Long docId, Long userId, String content) {
        Map<String, Object> update = new HashMap<>();
        update.put("docId", docId);
        update.put("userId", userId);
        update.put("content", content);
        update.put("timestamp", LocalDateTime.now());
        
        messagingTemplate.convertAndSend("/topic/documents/" + docId, update);
    }

    private String getDefaultColor(Long userId) {
        String[] colors = {"#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", 
                           "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"};
        return colors[Math.abs(userId.intValue()) % colors.length];
    }
}
