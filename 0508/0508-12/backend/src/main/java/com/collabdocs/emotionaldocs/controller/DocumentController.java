package com.collabdocs.emotionaldocs.controller;

import com.collabdocs.emotionaldocs.dto.*;
import com.collabdocs.emotionaldocs.entity.*;
import com.collabdocs.emotionaldocs.service.DocumentService;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping
    public ResponseEntity<Document> createDocument(@RequestBody CreateDocumentRequest request) {
        Document document = documentService.createDocument(
                request.getTitle(),
                request.getUserId(),
                request.getInitialContent()
        );
        return ResponseEntity.ok(document);
    }

    @GetMapping("/{docId}")
    public ResponseEntity<Document> getDocument(@PathVariable Long docId) {
        return ResponseEntity.ok(documentService.getDocument(docId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Document>> getUserDocuments(@PathVariable Long userId) {
        return ResponseEntity.ok(documentService.getUserDocuments(userId));
    }

    @PutMapping("/{docId}/content")
    public ResponseEntity<Document> updateDocumentContent(
            @PathVariable Long docId,
            @RequestBody UpdateContentRequest request) {
        Document document = documentService.updateDocumentContent(
                docId,
                request.getUserId(),
                request.getContent(),
                request.isSave()
        );
        return ResponseEntity.ok(document);
    }

    @PostMapping("/{docId}/action")
    public ResponseEntity<Void> logAction(
            @PathVariable Long docId,
            @RequestBody LogActionRequest request) {
        documentService.logUserAction(
                docId,
                request.getUserId(),
                ActionLog.ActionType.valueOf(request.getActionType().toUpperCase()),
                request.getSelectedText(),
                request.getPositionStart(),
                request.getPositionEnd()
        );
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{docId}/versions")
    public ResponseEntity<List<DocumentVersion>> getVersions(@PathVariable Long docId) {
        return ResponseEntity.ok(documentService.getDocumentVersions(docId));
    }

    @GetMapping("/{docId}/actions")
    public ResponseEntity<List<ActionLog>> getActions(@PathVariable Long docId) {
        return ResponseEntity.ok(documentService.getActionLogs(docId));
    }

    @GetMapping("/{docId}/sentiment/history")
    public ResponseEntity<SentimentHistoryResponse> getSentimentHistory(@PathVariable Long docId) {
        return ResponseEntity.ok(documentService.getSentimentHistory(docId));
    }

    @GetMapping("/{docId}/sentiment/paragraphs")
    public ResponseEntity<List<ParagraphSentiment>> getParagraphSentiment(@PathVariable Long docId) {
        return ResponseEntity.ok(documentService.getParagraphSentiment(docId));
    }

    @GetMapping("/{docId}/sentiment/wordcloud")
    public ResponseEntity<WordCloudData> getWordCloud(@PathVariable Long docId) {
        return ResponseEntity.ok(documentService.getWordCloudData(docId));
    }

    @Data
    public static class CreateDocumentRequest {
        private String title;
        private Long userId;
        private String initialContent;
    }

    @Data
    public static class UpdateContentRequest {
        private Long userId;
        private String content;
        private boolean save;
    }

    @Data
    public static class LogActionRequest {
        private Long userId;
        private String actionType;
        private String selectedText;
        private Integer positionStart;
        private Integer positionEnd;
    }
}
