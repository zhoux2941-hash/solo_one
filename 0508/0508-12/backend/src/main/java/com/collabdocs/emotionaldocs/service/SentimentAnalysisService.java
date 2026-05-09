package com.collabdocs.emotionaldocs.service;

import com.collabdocs.emotionaldocs.dto.ParagraphCacheData;
import com.collabdocs.emotionaldocs.dto.ParagraphSentiment;
import com.collabdocs.emotionaldocs.dto.SentimentResult;
import com.collabdocs.emotionaldocs.dto.WordCloudData;
import com.collabdocs.emotionaldocs.entity.SentimentSnapshot.Emotion;
import edu.stanford.nlp.pipeline.*;
import edu.stanford.nlp.ling.CoreAnnotations;
import edu.stanford.nlp.sentiment.SentimentCoreAnnotations;
import edu.stanford.nlp.util.CoreMap;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SentimentAnalysisService {

    private final ParagraphSentimentCacheService cacheService;
    private final ParagraphActivityService paragraphActivityService;
    private final ConflictDetectionService conflictDetectionService;

    private StanfordCoreNLP pipeline;

    private static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
            "the", "a", "an", "and", "or", "but", "is", "are", "was", "were",
            "be", "been", "being", "have", "has", "had", "do", "does", "did",
            "will", "would", "could", "should", "may", "might", "must",
            "i", "me", "my", "myself", "we", "our", "ours", "ourselves",
            "you", "your", "yours", "yourself", "yourselves", "he", "him",
            "his", "himself", "she", "her", "hers", "herself", "it", "its",
            "itself", "they", "them", "their", "theirs", "themselves",
            "this", "that", "these", "those", "what", "which", "who", "whom",
            "this", "that", "these", "those", "what", "which", "who", "whom",
            "in", "on", "at", "by", "for", "with", "about", "against",
            "between", "into", "through", "during", "before", "after",
            "above", "below", "to", "from", "up", "down", "out", "off",
            "over", "under", "again", "further", "then", "once", "here",
            "there", "when", "where", "why", "how", "all", "each", "few",
            "more", "most", "other", "some", "such", "no", "nor", "not",
            "only", "own", "same", "so", "than", "too", "very", "s", "t",
            "just", "don", "now", "can", "will", "just"
    ));

    private static final Map<String, Double> SENTIMENT_LABEL_SCORES = Map.of(
            "Very negative", -0.8,
            "Negative", -0.5,
            "Neutral", 0.0,
            "Positive", 0.5,
            "Very positive", 0.8
    );

    @PostConstruct
    public void init() {
        log.info("Initializing Stanford CoreNLP pipeline...");
        Properties props = new Properties();
        props.setProperty("annotators", "tokenize, ssplit, pos, lemma, parse, sentiment");
        props.setProperty("parse.keepPunct", "true");
        pipeline = new StanfordCoreNLP(props);
        log.info("Stanford CoreNLP pipeline initialized successfully.");
    }

    public SentimentResult analyzeSentiment(String content) {
        String plainText = extractPlainText(content);
        if (plainText == null || plainText.trim().isEmpty()) {
            return SentimentResult.builder()
                    .sentimentScore(0.0)
                    .dominantEmotion(Emotion.NEUTRAL)
                    .positiveScore(0.33)
                    .negativeScore(0.33)
                    .neutralScore(0.34)
                    .build();
        }

        Annotation doc = new Annotation(plainText);
        pipeline.annotate(doc);

        List<CoreMap> sentences = doc.get(CoreAnnotations.SentencesAnnotation.class);
        
        double totalScore = 0.0;
        int sentenceCount = 0;
        double positiveTotal = 0.0;
        double negativeTotal = 0.0;
        double neutralTotal = 0.0;

        for (CoreMap sentence : sentences) {
            String sentimentLabel = sentence.get(SentimentCoreAnnotations.SentimentClass.class);
            Double score = SENTIMENT_LABEL_SCORES.getOrDefault(sentimentLabel, 0.0);
            
            totalScore += score;
            sentenceCount++;

            if (score > 0.25) {
                positiveTotal++;
            } else if (score < -0.25) {
                negativeTotal++;
            } else {
                neutralTotal++;
            }
        }

        if (sentenceCount == 0) {
            return SentimentResult.builder()
                    .sentimentScore(0.0)
                    .dominantEmotion(Emotion.NEUTRAL)
                    .positiveScore(0.33)
                    .negativeScore(0.33)
                    .neutralScore(0.34)
                    .build();
        }

        double avgScore = Math.max(-1.0, Math.min(1.0, totalScore / sentenceCount));
        double positiveRatio = positiveTotal / sentenceCount;
        double negativeRatio = negativeTotal / sentenceCount;
        double neutralRatio = neutralTotal / sentenceCount;

        Emotion dominantEmotion;
        if (avgScore > 0.2) {
            dominantEmotion = Emotion.POSITIVE;
        } else if (avgScore < -0.2) {
            dominantEmotion = Emotion.NEGATIVE;
        } else {
            dominantEmotion = Emotion.NEUTRAL;
        }

        return SentimentResult.builder()
                .sentimentScore(Math.round(avgScore * 100.0) / 100.0)
                .dominantEmotion(dominantEmotion)
                .positiveScore(Math.round(positiveRatio * 100.0) / 100.0)
                .negativeScore(Math.round(negativeRatio * 100.0) / 100.0)
                .neutralScore(Math.round(neutralRatio * 100.0) / 100.0)
                .build();
    }

    public List<ParagraphSentiment> analyzeParagraphs(String content) {
        String plainText = extractPlainText(content);
        List<ParagraphSentiment> results = new ArrayList<>();
        
        if (plainText == null || plainText.trim().isEmpty()) {
            return results;
        }

        String[] paragraphs = plainText.split("\\n\\s*\\n");
        int index = 0;

        for (String paragraph : paragraphs) {
            String trimmed = paragraph.trim();
            if (trimmed.isEmpty()) {
                continue;
            }

            SentimentResult result = analyzeSentiment(trimmed);
            String emotion = result.getDominantEmotion().name();
            double intensity = Math.abs(result.getSentimentScore());

            results.add(ParagraphSentiment.builder()
                    .paragraphIndex(index++)
                    .text(trimmed.substring(0, Math.min(100, trimmed.length())) + (trimmed.length() > 100 ? "..." : ""))
                    .sentimentScore(result.getSentimentScore())
                    .emotion(emotion)
                    .intensity(Math.round(intensity * 100.0) / 100.0)
                    .build());
        }

        return results;
    }

    public WordCloudData extractWordCloud(String content) {
        String plainText = extractPlainText(content);
        if (plainText == null || plainText.trim().isEmpty()) {
            return WordCloudData.builder()
                    .positiveWords(new ArrayList<>())
                    .negativeWords(new ArrayList<>())
                    .build();
        }

        Annotation doc = new Annotation(plainText);
        pipeline.annotate(doc);

        Map<String, Integer> positiveWordMap = new HashMap<>();
        Map<String, Integer> negativeWordMap = new HashMap<>();

        List<CoreMap> sentences = doc.get(CoreAnnotations.SentencesAnnotation.class);

        for (CoreMap sentence : sentences) {
            String sentimentLabel = sentence.get(SentimentCoreAnnotations.SentimentClass.class);
            double score = SENTIMENT_LABEL_SCORES.getOrDefault(sentimentLabel, 0.0);

            Map<String, Integer> targetMap;
            if (score > 0.25) {
                targetMap = positiveWordMap;
            } else if (score < -0.25) {
                targetMap = negativeWordMap;
            } else {
                continue;
            }

            List<CoreMap> tokens = sentence.get(CoreAnnotations.TokensAnnotation.class);
            for (CoreMap token : tokens) {
                String word = token.get(CoreAnnotations.LemmaAnnotation.class).toLowerCase();
                String pos = token.get(CoreAnnotations.PartOfSpeechAnnotation.class);
                
                if (isMeaningfulWord(word, pos)) {
                    targetMap.merge(word, 1, Integer::sum);
                }
            }
        }

        return WordCloudData.builder()
                .positiveWords(convertToWordItems(positiveWordMap, 30))
                .negativeWords(convertToWordItems(negativeWordMap, 30))
                .build();
    }

    private boolean isMeaningfulWord(String word, String pos) {
        if (word == null || word.length() < 3) {
            return false;
        }
        if (STOP_WORDS.contains(word.toLowerCase())) {
            return false;
        }
        return pos.startsWith("JJ") || pos.startsWith("NN") || pos.startsWith("VB") || pos.startsWith("RB");
    }

    private List<WordCloudData.WordItem> convertToWordItems(Map<String, Integer> wordMap, int limit) {
        return wordMap.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> WordCloudData.WordItem.builder()
                        .text(entry.getKey())
                        .weight(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private String extractPlainText(String content) {
        if (content == null || content.isEmpty()) {
            return "";
        }
        try {
            return Jsoup.parse(content).text();
        } catch (Exception e) {
            log.warn("Failed to parse HTML content, using raw text", e);
            return content;
        }
    }

    public SentimentResult analyzeIncremental(Long docId, String content) {
        String plainText = extractPlainText(content);
        if (plainText == null || plainText.trim().isEmpty()) {
            return createNeutralResult();
        }

        List<String> paragraphs = extractParagraphs(plainText);
        log.info("Incremental analysis for doc {}: {} paragraphs", docId, paragraphs.size());

        List<ParagraphCacheData> allParagraphData = new ArrayList<>();
        int analyzedCount = 0;
        int cachedCount = 0;

        for (int i = 0; i < paragraphs.size(); i++) {
            String paragraph = paragraphs.get(i);
            String textHash = cacheService.calculateTextHash(paragraph);

            ParagraphCacheData cached = cacheService.getCachedParagraph(docId, i, textHash);
            
            if (cached != null) {
                cachedCount++;
                allParagraphData.add(cached);
            } else {
                analyzedCount++;
                SentimentResult paraResult = analyzeSingleParagraph(paragraph);
                int wordCount = countWords(paragraph);
                
                ParagraphCacheData newData = ParagraphCacheData.builder()
                        .paragraphIndex(i)
                        .textHash(textHash)
                        .sentimentScore(paraResult.getSentimentScore())
                        .emotion(paraResult.getDominantEmotion().name())
                        .positiveScore(paraResult.getPositiveScore())
                        .negativeScore(paraResult.getNegativeScore())
                        .neutralScore(paraResult.getNeutralScore())
                        .wordCount(wordCount)
                        .timestamp(System.currentTimeMillis())
                        .build();
                
                cacheService.cacheParagraphSentiment(docId, i, newData);
                allParagraphData.add(newData);
            }
        }

        log.info("Incremental analysis complete: analyzed={}, cached={}", analyzedCount, cachedCount);

        return calculateWeightedAverage(allParagraphData);
    }

    public SentimentResult analyzeIncrementalWithUser(Long docId, Long userId, String username, String content) {
        String plainText = extractPlainText(content);
        if (plainText == null || plainText.trim().isEmpty()) {
            return createNeutralResult();
        }

        List<String> paragraphs = extractParagraphs(plainText);
        log.info("Incremental analysis with user for doc {}: {} paragraphs, user: {}", 
                docId, paragraphs.size(), username);

        List<ParagraphCacheData> allParagraphData = new ArrayList<>();
        List<Integer> modifiedParagraphIndices = new ArrayList<>();
        int analyzedCount = 0;
        int cachedCount = 0;

        for (int i = 0; i < paragraphs.size(); i++) {
            String paragraph = paragraphs.get(i);
            String textHash = cacheService.calculateTextHash(paragraph);

            ParagraphCacheData cached = cacheService.getCachedParagraph(docId, i, textHash);
            
            if (cached != null) {
                cachedCount++;
                allParagraphData.add(cached);
            } else {
                analyzedCount++;
                modifiedParagraphIndices.add(i);
                
                SentimentResult paraResult = analyzeSingleParagraph(paragraph);
                int wordCount = countWords(paragraph);
                
                ParagraphCacheData newData = ParagraphCacheData.builder()
                        .paragraphIndex(i)
                        .textHash(textHash)
                        .sentimentScore(paraResult.getSentimentScore())
                        .emotion(paraResult.getDominantEmotion().name())
                        .positiveScore(paraResult.getPositiveScore())
                        .negativeScore(paraResult.getNegativeScore())
                        .neutralScore(paraResult.getNeutralScore())
                        .wordCount(wordCount)
                        .timestamp(System.currentTimeMillis())
                        .build();
                
                cacheService.cacheParagraphSentiment(docId, i, newData);
                allParagraphData.add(newData);
                
                paragraphActivityService.recordEditActivity(
                        docId, i, userId, username,
                        paraResult.getSentimentScore(),
                        paraResult.getDominantEmotion().name(),
                        textHash
                );
                
                conflictDetectionService.detectAndBroadcast(
                        docId, i, userId, username,
                        paraResult.getSentimentScore(),
                        paraResult.getDominantEmotion().name()
                );
            }
        }

        log.info("Incremental analysis with user complete: analyzed={}, cached={}, modified={}", 
                analyzedCount, cachedCount, modifiedParagraphIndices.size());

        return calculateWeightedAverage(allParagraphData);
    }

    public List<String> extractParagraphs(String plainText) {
        if (plainText == null || plainText.trim().isEmpty()) {
            return Collections.emptyList();
        }

        String[] paragraphs = plainText.split("\\n\\s*\\n");
        return Arrays.stream(paragraphs)
                .map(String::trim)
                .filter(p -> !p.isEmpty())
                .collect(Collectors.toList());
    }

    private SentimentResult analyzeSingleParagraph(String paragraph) {
        if (paragraph == null || paragraph.trim().isEmpty()) {
            return createNeutralResult();
        }

        Annotation doc = new Annotation(paragraph);
        pipeline.annotate(doc);

        List<CoreMap> sentences = doc.get(CoreAnnotations.SentencesAnnotation.class);
        
        double totalScore = 0.0;
        int sentenceCount = 0;
        double positiveTotal = 0.0;
        double negativeTotal = 0.0;
        double neutralTotal = 0.0;

        for (CoreMap sentence : sentences) {
            String sentimentLabel = sentence.get(SentimentCoreAnnotations.SentimentClass.class);
            Double score = SENTIMENT_LABEL_SCORES.getOrDefault(sentimentLabel, 0.0);
            
            totalScore += score;
            sentenceCount++;

            if (score > 0.25) {
                positiveTotal++;
            } else if (score < -0.25) {
                negativeTotal++;
            } else {
                neutralTotal++;
            }
        }

        if (sentenceCount == 0) {
            return createNeutralResult();
        }

        double avgScore = Math.max(-1.0, Math.min(1.0, totalScore / sentenceCount));
        double positiveRatio = positiveTotal / sentenceCount;
        double negativeRatio = negativeTotal / sentenceCount;
        double neutralRatio = neutralTotal / sentenceCount;

        Emotion dominantEmotion;
        if (avgScore > 0.2) {
            dominantEmotion = Emotion.POSITIVE;
        } else if (avgScore < -0.2) {
            dominantEmotion = Emotion.NEGATIVE;
        } else {
            dominantEmotion = Emotion.NEUTRAL;
        }

        return SentimentResult.builder()
                .sentimentScore(Math.round(avgScore * 100.0) / 100.0)
                .dominantEmotion(dominantEmotion)
                .positiveScore(Math.round(positiveRatio * 100.0) / 100.0)
                .negativeScore(Math.round(negativeRatio * 100.0) / 100.0)
                .neutralScore(Math.round(neutralRatio * 100.0) / 100.0)
                .build();
    }

    private SentimentResult calculateWeightedAverage(List<ParagraphCacheData> paragraphs) {
        if (paragraphs.isEmpty()) {
            return createNeutralResult();
        }

        double totalWeightedScore = 0.0;
        double totalWeightedPositive = 0.0;
        double totalWeightedNegative = 0.0;
        double totalWeightedNeutral = 0.0;
        int totalWords = 0;

        for (ParagraphCacheData para : paragraphs) {
            int words = para.getWordCount() > 0 ? para.getWordCount() : 1;
            totalWeightedScore += para.getSentimentScore() * words;
            totalWeightedPositive += para.getPositiveScore() * words;
            totalWeightedNegative += para.getNegativeScore() * words;
            totalWeightedNeutral += para.getNeutralScore() * words;
            totalWords += words;
        }

        if (totalWords == 0) {
            return createNeutralResult();
        }

        double avgScore = Math.max(-1.0, Math.min(1.0, totalWeightedScore / totalWords));
        double positiveRatio = totalWeightedPositive / totalWords;
        double negativeRatio = totalWeightedNegative / totalWords;
        double neutralRatio = totalWeightedNeutral / totalWords;

        Emotion dominantEmotion;
        if (avgScore > 0.2) {
            dominantEmotion = Emotion.POSITIVE;
        } else if (avgScore < -0.2) {
            dominantEmotion = Emotion.NEGATIVE;
        } else {
            dominantEmotion = Emotion.NEUTRAL;
        }

        return SentimentResult.builder()
                .sentimentScore(Math.round(avgScore * 100.0) / 100.0)
                .dominantEmotion(dominantEmotion)
                .positiveScore(Math.round(positiveRatio * 100.0) / 100.0)
                .negativeScore(Math.round(negativeRatio * 100.0) / 100.0)
                .neutralScore(Math.round(neutralRatio * 100.0) / 100.0)
                .build();
    }

    private SentimentResult createNeutralResult() {
        return SentimentResult.builder()
                .sentimentScore(0.0)
                .dominantEmotion(Emotion.NEUTRAL)
                .positiveScore(0.33)
                .negativeScore(0.33)
                .neutralScore(0.34)
                .build();
    }

    private int countWords(String text) {
        if (text == null || text.trim().isEmpty()) {
            return 0;
        }
        return text.trim().split("\\s+").length;
    }

    public List<ParagraphSentiment> analyzeParagraphsIncremental(Long docId, String content) {
        String plainText = extractPlainText(content);
        if (plainText == null || plainText.trim().isEmpty()) {
            return Collections.emptyList();
        }

        List<String> paragraphs = extractParagraphs(plainText);
        List<ParagraphSentiment> results = new ArrayList<>();

        for (int i = 0; i < paragraphs.size(); i++) {
            String paragraph = paragraphs.get(i);
            String textHash = cacheService.calculateTextHash(paragraph);

            ParagraphCacheData cached = cacheService.getCachedParagraph(docId, i, textHash);
            SentimentResult result;
            double intensity;

            if (cached != null) {
                result = SentimentResult.builder()
                        .sentimentScore(cached.getSentimentScore())
                        .dominantEmotion(Emotion.valueOf(cached.getEmotion()))
                        .positiveScore(cached.getPositiveScore())
                        .negativeScore(cached.getNegativeScore())
                        .neutralScore(cached.getNeutralScore())
                        .build();
                intensity = Math.abs(cached.getSentimentScore());
            } else {
                result = analyzeSingleParagraph(paragraph);
                intensity = Math.abs(result.getSentimentScore());
                
                ParagraphCacheData newData = ParagraphCacheData.builder()
                        .paragraphIndex(i)
                        .textHash(textHash)
                        .sentimentScore(result.getSentimentScore())
                        .emotion(result.getDominantEmotion().name())
                        .positiveScore(result.getPositiveScore())
                        .negativeScore(result.getNegativeScore())
                        .neutralScore(result.getNeutralScore())
                        .wordCount(countWords(paragraph))
                        .timestamp(System.currentTimeMillis())
                        .build();
                
                cacheService.cacheParagraphSentiment(docId, i, newData);
            }

            results.add(ParagraphSentiment.builder()
                    .paragraphIndex(i)
                    .text(paragraph.substring(0, Math.min(100, paragraph.length())) + (paragraph.length() > 100 ? "..." : ""))
                    .sentimentScore(result.getSentimentScore())
                    .emotion(result.getDominantEmotion().name())
                    .intensity(Math.round(intensity * 100.0) / 100.0)
                    .build());
        }

        return results;
    }
}
