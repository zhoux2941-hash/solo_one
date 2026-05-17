package com.wenwan.bracelet.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "style_templates")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StyleTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "craftsman_id")
    private User craftsman;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TemplateCategory category;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String overallSize;

    private String targetAudience;

    private String colorScheme;

    @Column(columnDefinition = "TEXT")
    private String symbolicMeaning;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(columnDefinition = "TEXT")
    private String mainImageUrl;

    @Column(columnDefinition = "TEXT")
    private String imageUrls;

    @Column(columnDefinition = "TEXT")
    private String materialList;

    private Integer beadCount;

    private String beadSize;

    private Integer viewCount;

    private Integer likeCount;

    private Integer useCount;

    private Boolean isPublished;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public enum TemplateCategory {
        ANCIENT_ZEN("古风禅意"),
        CHINESE_MINIMALIST("国风简约"),
        ETHNIC_RETRO("民族复古"),
        BUDDHA_THEME("本命佛主题"),
        LUCKY_SYMBOL("吉祥符号"),
        NATURE_ELEMENTS("自然元素"),
        MODERN_FASHION("现代时尚");

        private final String displayName;

        TemplateCategory(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (viewCount == null) viewCount = 0;
        if (likeCount == null) likeCount = 0;
        if (useCount == null) useCount = 0;
        if (isPublished == null) isPublished = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getCraftsman() {
        return craftsman;
    }

    public void setCraftsman(User craftsman) {
        this.craftsman = craftsman;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public TemplateCategory getCategory() {
        return category;
    }

    public void setCategory(TemplateCategory category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getOverallSize() {
        return overallSize;
    }

    public void setOverallSize(String overallSize) {
        this.overallSize = overallSize;
    }

    public String getTargetAudience() {
        return targetAudience;
    }

    public void setTargetAudience(String targetAudience) {
        this.targetAudience = targetAudience;
    }

    public String getColorScheme() {
        return colorScheme;
    }

    public void setColorScheme(String colorScheme) {
        this.colorScheme = colorScheme;
    }

    public String getSymbolicMeaning() {
        return symbolicMeaning;
    }

    public void setSymbolicMeaning(String symbolicMeaning) {
        this.symbolicMeaning = symbolicMeaning;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getMainImageUrl() {
        return mainImageUrl;
    }

    public void setMainImageUrl(String mainImageUrl) {
        this.mainImageUrl = mainImageUrl;
    }

    public String getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(String imageUrls) {
        this.imageUrls = imageUrls;
    }

    public String getMaterialList() {
        return materialList;
    }

    public void setMaterialList(String materialList) {
        this.materialList = materialList;
    }

    public Integer getBeadCount() {
        return beadCount;
    }

    public void setBeadCount(Integer beadCount) {
        this.beadCount = beadCount;
    }

    public String getBeadSize() {
        return beadSize;
    }

    public void setBeadSize(String beadSize) {
        this.beadSize = beadSize;
    }

    public Integer getViewCount() {
        return viewCount;
    }

    public void setViewCount(Integer viewCount) {
        this.viewCount = viewCount;
    }

    public Integer getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(Integer likeCount) {
        this.likeCount = likeCount;
    }

    public Integer getUseCount() {
        return useCount;
    }

    public void setUseCount(Integer useCount) {
        this.useCount = useCount;
    }

    public Boolean getPublished() {
        return isPublished;
    }

    public void setPublished(Boolean published) {
        isPublished = published;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
