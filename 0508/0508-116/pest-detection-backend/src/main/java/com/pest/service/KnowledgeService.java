package com.pest.service;

import com.pest.entity.Knowledge;
import com.pest.repository.KnowledgeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class KnowledgeService {

    @Autowired
    private KnowledgeRepository knowledgeRepository;

    @Transactional
    public Knowledge create(Knowledge knowledge) {
        knowledge.setCreateTime(LocalDateTime.now());
        knowledge.setUpdateTime(LocalDateTime.now());
        knowledge.setViewCount(0);
        return knowledgeRepository.save(knowledge);
    }

    @Transactional
    public Knowledge update(Long id, Knowledge updateData) {
        Knowledge existing = knowledgeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("知识库不存在"));

        existing.setTitle(updateData.getTitle());
        existing.setContent(updateData.getContent());
        existing.setCropType(updateData.getCropType());
        existing.setPestName(updateData.getPestName());
        existing.setUpdateTime(LocalDateTime.now());

        return knowledgeRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        if (!knowledgeRepository.existsById(id)) {
            throw new RuntimeException("知识库不存在");
        }
        knowledgeRepository.deleteById(id);
    }

    @Transactional
    public Knowledge getDetail(Long id) {
        Knowledge knowledge = knowledgeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("知识库不存在"));
        knowledge.setViewCount(knowledge.getViewCount() + 1);
        return knowledgeRepository.save(knowledge);
    }

    public Knowledge getById(Long id) {
        return knowledgeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("知识库不存在"));
    }

    public List<Knowledge> getByExpert(Long expertId) {
        return knowledgeRepository.findByExpertIdOrderByUpdateTimeDesc(expertId);
    }

    public List<Knowledge> getAll() {
        return knowledgeRepository.findAllByOrderByUpdateTimeDesc();
    }

    public List<Knowledge> search(String keyword, String cropType) {
        return knowledgeRepository.search(keyword, cropType);
    }
}