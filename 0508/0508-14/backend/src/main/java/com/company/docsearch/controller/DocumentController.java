package com.company.docsearch.controller;

import com.company.docsearch.entity.Document;
import com.company.docsearch.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentRepository documentRepository;

    @GetMapping
    public ResponseEntity<List<Document>> getAllDocuments() {
        return ResponseEntity.ok(documentRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Document> getDocumentById(@PathVariable String id) {
        Optional<Document> doc = documentRepository.findById(id);
        return doc.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Document> createDocument(@RequestBody Document document) {
        if (document.getDocId() == null || document.getDocId().trim().isEmpty()) {
            document.setDocId(UUID.randomUUID().toString().substring(0, 8));
        }
        document.setCreatedAt(LocalDateTime.now());
        document.setUpdatedAt(LocalDateTime.now());
        if (document.getClickCount() == null) {
            document.setClickCount(0);
        }
        Document saved = documentRepository.save(document);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Document> updateDocument(@PathVariable String id, @RequestBody Document document) {
        Optional<Document> existingOpt = documentRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Document existing = existingOpt.get();
        if (document.getTitle() != null) existing.setTitle(document.getTitle());
        if (document.getContent() != null) existing.setContent(document.getContent());
        if (document.getCategory() != null) existing.setCategory(document.getCategory());
        existing.setUpdatedAt(LocalDateTime.now());

        Document saved = documentRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable String id) {
        if (!documentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        documentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
