const STORAGE_KEYS = {
    DISHES: 'canteen_dishes',
    REVIEWS: 'canteen_reviews',
    USER_REVIEWS: 'canteen_user_reviews',
    USER_PREFERENCE: 'canteen_user_preference'
};

const WINDOWS = [
    { id: '1', name: '一食堂', icon: '🥢' },
    { id: '2', name: '二食堂', icon: '🍚' },
    { id: '3', name: '三食堂', icon: '🍜' },
    { id: '4', name: '四食堂', icon: '🍱' },
    { id: '5', name: '清真食堂', icon: '🥙' }
];

const DISH_EMOJIS = ['🍗', '🥩', '🍖', '🐔', '🐟', '🦐', '🥦', '🥕', '🍆', '🥬', '🍅', '🥔', '🌽', '🍚', '🍜', '🍝', '🍲', '🥘', '🍛', '🍱'];

const INITIAL_DISHES = [
    { id: '1', name: '红烧肉', windowId: '1', emoji: '🍖', tasteTags: ['太油', '太咸'] },
    { id: '2', name: '宫保鸡丁', windowId: '1', emoji: '🍗', tasteTags: ['太辣', '刚好'] },
    { id: '3', name: '清蒸鲈鱼', windowId: '1', emoji: '🐟', tasteTags: ['太淡', '刚好'] },
    { id: '4', name: '麻婆豆腐', windowId: '1', emoji: '🥘', tasteTags: ['太辣', '太咸'] },
    { id: '5', name: '糖醋排骨', windowId: '2', emoji: '🍖', tasteTags: ['刚好', '太甜'] },
    { id: '6', name: '鱼香肉丝', windowId: '2', emoji: '🍗', tasteTags: ['太辣', '太咸'] },
    { id: '7', name: '西红柿炒蛋', windowId: '2', emoji: '🍳', tasteTags: ['刚好', '太淡'] },
    { id: '8', name: '酸辣土豆丝', windowId: '2', emoji: '🥔', tasteTags: ['太辣', '太酸'] },
    { id: '9', name: '兰州拉面', windowId: '3', emoji: '🍜', tasteTags: ['太淡', '刚好'] },
    { id: '10', name: '牛肉盖饭', windowId: '3', emoji: '🍛', tasteTags: ['太油', '太咸'] },
    { id: '11', name: '饺子', windowId: '3', emoji: '🥟', tasteTags: ['刚好', '太淡'] },
    { id: '12', name: '黄焖鸡米饭', windowId: '3', emoji: '🍗', tasteTags: ['太油', '太咸'] },
    { id: '13', name: '麻辣香锅', windowId: '4', emoji: '🍲', tasteTags: ['太辣', '太油'] },
    { id: '14', name: '水煮鱼', windowId: '4', emoji: '🐟', tasteTags: ['太辣', '太油'] },
    { id: '15', name: '干锅包菜', windowId: '4', emoji: '🥬', tasteTags: ['太辣', '太油'] },
    { id: '16', name: '毛血旺', windowId: '4', emoji: '🍲', tasteTags: ['太辣', '太咸'] },
    { id: '17', name: '大盘鸡', windowId: '5', emoji: '🍗', tasteTags: ['太辣', '刚好'] },
    { id: '18', name: '手抓饭', windowId: '5', emoji: '🍚', tasteTags: ['太油', '刚好'] },
    { id: '19', name: '烤包子', windowId: '5', emoji: '🥙', tasteTags: ['刚好', '太咸'] },
    { id: '20', name: '羊肉汤', windowId: '5', emoji: '🍲', tasteTags: ['太淡', '刚好'] }
];

const TAG_COLORS = {
    '太咸': { bg: 'rgba(255, 107, 107, 0.15)', color: '#ee5a5a' },
    '太淡': { bg: 'rgba(100, 200, 255, 0.15)', color: '#4aa8d8' },
    '太油': { bg: 'rgba(255, 165, 0, 0.15)', color: '#ff8c00' },
    '太辣': { bg: 'rgba(255, 80, 80, 0.15)', color: '#ff5050' },
    '刚好': { bg: 'rgba(80, 200, 120, 0.15)', color: '#32b368' }
};

const RATING_TEXTS = ['差评', '一般', '还行', '推荐', '超赞'];

const REVIEW_TYPES = {
    SELF: 'self',
    OTHER: 'other'
};

const REVIEW_TYPE_LABELS = {
    [REVIEW_TYPES.SELF]: '自己吃',
    [REVIEW_TYPES.OTHER]: '帮别人点'
};

class ReviewService {
    constructor(storageKeys) {
        this.storageKeys = storageKeys;
        this.allReviews = [];
        this.currentUserReviews = [];
        this.currentUserId = 'current_user';
        this.load();
    }

    load() {
        const storedAll = localStorage.getItem(this.storageKeys.REVIEWS);
        const storedUser = localStorage.getItem(this.storageKeys.USER_REVIEWS);

        if (storedAll) {
            this.allReviews = JSON.parse(storedAll);
            this.allReviews = this._migrateReviews(this.allReviews);
        }

        if (storedUser) {
            this.currentUserReviews = JSON.parse(storedUser);
            this.currentUserReviews = this._migrateReviews(this.currentUserReviews);
        }
    }

    _migrateReviews(reviews) {
        return reviews.map(review => {
            if (!review.reviewType) {
                return {
                    ...review,
                    reviewType: REVIEW_TYPES.SELF
                };
            }
            return review;
        });
    }

    save() {
        localStorage.setItem(this.storageKeys.REVIEWS, JSON.stringify(this.allReviews));
        localStorage.setItem(this.storageKeys.USER_REVIEWS, JSON.stringify(this.currentUserReviews));
    }

    initMockData(dishes) {
        if (this.allReviews.length > 0) return;

        const mockReviews = [];
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

        dishes.forEach(dish => {
            const reviewCount = Math.floor(Math.random() * 15) + 5;
            for (let i = 0; i < reviewCount; i++) {
                const rating = Math.floor(Math.random() * 5) + 1;
                const tags = dish.tasteTags.filter(() => Math.random() > 0.5);
                if (tags.length === 0) {
                    tags.push(dish.tasteTags[Math.floor(Math.random() * dish.tasteTags.length)]);
                }

                mockReviews.push({
                    id: `mock_${dish.id}_${i}`,
                    dishId: dish.id,
                    rating,
                    tags,
                    comment: '',
                    userId: 'mock_user',
                    reviewType: Math.random() > 0.3 ? REVIEW_TYPES.SELF : REVIEW_TYPES.OTHER,
                    createdAt: sevenDaysAgo + Math.random() * (now - sevenDaysAgo)
                });
            }
        });

        this.allReviews = mockReviews;
        this.save();
    }

    addReview(reviewData) {
        const review = {
            id: `review_${Date.now()}`,
            userId: this.currentUserId,
            reviewType: REVIEW_TYPES.SELF,
            createdAt: Date.now(),
            ...reviewData
        };

        this.allReviews.push(review);
        this.currentUserReviews.push(review);
        this.save();

        return review;
    }

    getDishReviews(dishId, options = {}) {
        let result = this.allReviews.filter(r => r.dishId === dishId);
        if (options.reviewType) {
            result = result.filter(r => r.reviewType === options.reviewType);
        }
        if (options.since) {
            result = result.filter(r => r.createdAt >= options.since);
        }
        return result;
    }

    getUserReviews(userId, options = {}) {
        let result = this.currentUserReviews.filter(r => r.userId === userId);
        if (options.reviewType) {
            result = result.filter(r => r.reviewType === options.reviewType);
        }
        return result;
    }

    getCurrentUserReviews(options = {}) {
        return this.getUserReviews(this.currentUserId, options);
    }

    getDishAverageRating(dishId, options = {}) {
        const reviews = this.getDishReviews(dishId, options);
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return sum / reviews.length;
    }

    getDishBayesianRating(dishId, priorMean, weight = 5, options = {}) {
        const reviews = this.getDishReviews(dishId, options);
        if (reviews.length === 0) return priorMean;
        const ratings = reviews.map(r => r.rating);
        const sum = ratings.reduce((acc, r) => acc + r, 0);
        return (sum + priorMean * weight) / (ratings.length + weight);
    }

    getOverallAverageRating(options = {}) {
        let reviews = this.allReviews;
        if (options.reviewType) {
            reviews = reviews.filter(r => r.reviewType === options.reviewType);
        }
        if (reviews.length === 0) return 3.0;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return sum / reviews.length;
    }

    getDishTagCloud(dishId, options = {}) {
        const reviews = this.getDishReviews(dishId, options);
        const tagCount = {};

        reviews.forEach(review => {
            review.tags.forEach(tag => {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        });

        const totalReviews = reviews.length;
        const tags = Object.entries(tagCount).map(([tag, count]) => ({
            tag,
            count,
            percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0
        }));

        return tags.sort((a, b) => b.count - a.count);
    }

    getAvoidList(dishes, days = 7, minReviews = 3) {
        const since = Date.now() - days * 24 * 60 * 60 * 1000;
        const priorMean = this.getOverallAverageRating();

        const recentReviews = this.allReviews.filter(r => r.createdAt >= since);

        const dishRecentReviews = {};
        recentReviews.forEach(review => {
            if (!dishRecentReviews[review.dishId]) {
                dishRecentReviews[review.dishId] = [];
            }
            dishRecentReviews[review.dishId].push(review);
        });

        const scoredDishes = Object.entries(dishRecentReviews)
            .filter(([_, reviews]) => reviews.length >= minReviews)
            .map(([dishId, dishReviews]) => {
                const ratings = dishReviews.map(r => r.rating);
                const bayesianRating = this._bayesianAverage(ratings, priorMean, 5);
                const rawAvg = ratings.reduce((acc, r) => acc + r, 0) / ratings.length;
                return {
                    dishId,
                    avgRating: bayesianRating,
                    rawAvgRating: rawAvg,
                    reviewCount: dishReviews.length
                };
            })
            .sort((a, b) => a.avgRating - b.avgRating)
            .slice(0, 5);

        return scoredDishes.map(item => ({
            ...dishes.find(d => d.id === item.dishId),
            avgRating: item.avgRating,
            reviewCount: item.reviewCount
        }));
    }

    getUserPreference(userId, priorMean) {
        const reviews = this.getUserReviews(userId, { reviewType: REVIEW_TYPES.SELF });
        if (reviews.length === 0) return null;

        const tagCount = {};
        const tagRatings = {};

        reviews.forEach(review => {
            review.tags.forEach(tag => {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
                if (!tagRatings[tag]) {
                    tagRatings[tag] = [];
                }
                tagRatings[tag].push(review.rating);
            });
        });

        const preferredTags = Object.entries(tagCount)
            .map(([tag, count]) => ({
                tag,
                count,
                avgRating: this._bayesianAverage(tagRatings[tag], priorMean, 3)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        return {
            tags: preferredTags,
            totalReviews: reviews.length
        };
    }

    getTasteProfile(userId, priorMean) {
        const reviews = this.getUserReviews(userId, { reviewType: REVIEW_TYPES.SELF });

        if (reviews.length === 0) {
            return {
                salty: 0,
                light: 0,
                oily: 0,
                spicy: 0,
                totalReviews: 0,
                avgRating: 0
            };
        }

        const tasteMap = {
            '太咸': 'salty',
            '太淡': 'light',
            '太油': 'oily',
            '太辣': 'spicy',
            '刚好': 'balanced'
        };

        const tasteCounts = { salty: 0, light: 0, oily: 0, spicy: 0 };
        const tasteRatings = { salty: [], light: [], oily: [], spicy: [] };
        let totalRating = 0;

        reviews.forEach(review => {
            totalRating += review.rating;
            review.tags.forEach(tag => {
                const taste = tasteMap[tag];
                if (taste && taste !== 'balanced') {
                    tasteCounts[taste]++;
                    tasteRatings[taste].push(review.rating);
                }
            });
        });

        const totalTasteTags = Object.values(tasteCounts).reduce((a, b) => a + b, 0);
        const profile = {
            totalReviews: reviews.length,
            avgRating: totalRating / reviews.length
        };

        ['salty', 'light', 'oily', 'spicy'].forEach(taste => {
            if (tasteCounts[taste] === 0) {
                profile[taste] = 0;
            } else {
                const bayesianRating = this._bayesianAverage(tasteRatings[taste], priorMean, 2);
                const frequency = tasteCounts[taste] / Math.max(totalTasteTags, 1);
                const normalizedRating = (bayesianRating - 1) / 4;
                profile[taste] = Math.min(100, frequency * normalizedRating * 150);
            }
        });

        return profile;
    }

    getRecommendedDishes(dishes, userId, priorMean) {
        const preference = this.getUserPreference(userId, priorMean);

        if (!preference) {
            return dishes
                .map(dish => ({
                    dish,
                    score: this.getDishBayesianRating(dish.id, priorMean)
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 8)
                .map(item => item.dish);
        }

        const preferredTagNames = preference.tags.map(t => t.tag);

        const scoredDishes = dishes.map(dish => {
            let score = this.getDishBayesianRating(dish.id, priorMean);

            const dishTags = this.getDishTagCloud(dish.id);
            dishTags.forEach(tagInfo => {
                if (preferredTagNames.includes(tagInfo.tag)) {
                    const pref = preference.tags.find(t => t.tag === tagInfo.tag);
                    if (pref.avgRating >= 3.5) {
                        score += tagInfo.percentage / 100 * 2;
                    } else if (pref.avgRating < 2.5) {
                        score -= tagInfo.percentage / 100 * 2;
                    }
                }
            });

            return { dish, score };
        });

        return scoredDishes
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map(item => item.dish);
    }

    _bayesianAverage(ratings, priorMean, weight = 5) {
        if (ratings.length === 0) return priorMean;
        const sum = ratings.reduce((acc, r) => acc + r, 0);
        return (sum + priorMean * weight) / (ratings.length + weight);
    }
}

let currentDishId = null;
let selectedRating = 0;
let selectedReviewType = REVIEW_TYPES.SELF;
let currentWindowFilter = 'all';
let dishes = [];
let reviewService = null;

function initData() {
    const storedDishes = localStorage.getItem(STORAGE_KEYS.DISHES);

    if (!storedDishes) {
        dishes = [...INITIAL_DISHES];
        localStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(dishes));
    } else {
        dishes = JSON.parse(storedDishes);
    }

    reviewService = new ReviewService(STORAGE_KEYS);
    reviewService.initMockData(dishes);
}

function getDishReviews(dishId) {
    return reviewService.getDishReviews(dishId);
}

function getOverallAverageRating() {
    return reviewService.getOverallAverageRating();
}

function getBayesianAverage(ratings, priorMean, weight = 5) {
    if (ratings.length === 0) return priorMean;
    const sum = ratings.reduce((acc, r) => acc + r, 0);
    return (sum + priorMean * weight) / (ratings.length + weight);
}

function getDishAverageRating(dishId) {
    const priorMean = getOverallAverageRating();
    return reviewService.getDishBayesianRating(dishId, priorMean);
}

function getDishTagCloud(dishId) {
    return reviewService.getDishTagCloud(dishId);
}

function getTagSizeClass(percentage) {
    if (percentage >= 40) return 'high';
    if (percentage >= 20) return 'medium';
    return 'low';
}

function getUserPreference() {
    const priorMean = getOverallAverageRating();
    return reviewService.getUserPreference(reviewService.currentUserId, priorMean);
}

function getTasteProfile() {
    const priorMean = getOverallAverageRating();
    return reviewService.getTasteProfile(reviewService.currentUserId, priorMean);
}

function getTasteDescription(score, type) {
    if (score === 0) return '暂无数据';

    const descriptions = {
        salty: [
            { threshold: 30, text: '口味偏清淡，不太能接受咸味' },
            { threshold: 60, text: '咸度适中，偶尔喜欢咸香口味' },
            { threshold: 100, text: '喜欢咸香口味，无盐不欢' }
        ],
        light: [
            { threshold: 30, text: '喜欢重口味，不太能接受清淡' },
            { threshold: 60, text: '淡度适中，偶尔喜欢清淡口味' },
            { threshold: 100, text: '偏爱清淡养生，原汁原味最好' }
        ],
        oily: [
            { threshold: 30, text: '饮食健康，排斥油腻食物' },
            { threshold: 60, text: '油度适中，偶尔享受油香' },
            { threshold: 100, text: '喜欢油香四溢，无油不香' }
        ],
        spicy: [
            { threshold: 30, text: '不能吃辣，一点辣都怕' },
            { threshold: 60, text: '微辣即可，偶尔挑战中辣' },
            { threshold: 100, text: '无辣不欢，越辣越过瘾' }
        ]
    };

    const descList = descriptions[type];
    for (let i = descList.length - 1; i >= 0; i--) {
        if (score >= descList[i].threshold) {
            return descList[i].text;
        }
    }
    return descList[0].text;
}

function drawRadarChart(data) {
    const canvas = document.getElementById('radar-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 60;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const labels = ['咸度', '淡度', '油腻', '辣度'];
    const colors = ['#ff6b6b', '#4facfe', '#ffa500', '#ff5050'];
    const values = [data.salty, data.light, data.oily, data.spicy];

    const levels = 5;
    for (let i = 1; i <= levels; i++) {
        const levelRadius = (radius / levels) * i;
        ctx.beginPath();
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        for (let j = 0; j < labels.length; j++) {
            const angle = (Math.PI * 2 / labels.length) * j - Math.PI / 2;
            const x = centerX + levelRadius * Math.cos(angle);
            const y = centerY + levelRadius * Math.sin(angle);
            if (j === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();
    }

    for (let i = 0; i < labels.length; i++) {
        const angle = (Math.PI * 2 / labels.length) * i - Math.PI / 2;
        ctx.beginPath();
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
        ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i < labels.length; i++) {
        const angle = (Math.PI * 2 / labels.length) * i - Math.PI / 2;
        const value = values[i] / 100;
        const x = centerX + radius * value * Math.cos(angle);
        const y = centerY + radius * value * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(102, 126, 234, 0.25)';
    ctx.fill();
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.stroke();

    for (let i = 0; i < labels.length; i++) {
        const angle = (Math.PI * 2 / labels.length) * i - Math.PI / 2;
        const value = values[i] / 100;
        const x = centerX + radius * value * Math.cos(angle);
        const y = centerY + radius * value * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = colors[i];
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    for (let i = 0; i < labels.length; i++) {
        const angle = (Math.PI * 2 / labels.length) * i - Math.PI / 2;
        const x = centerX + (radius + 35) * Math.cos(angle);
        const y = centerY + (radius + 35) * Math.sin(angle);

        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = colors[i];
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[i], x, y);

        ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText(`${Math.round(values[i])}%`, x, y + 18);
    }

    if (data.totalReviews === 0) {
        ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('暂无点评数据', centerX, centerY);
    }
}

function renderTasteProfile() {
    const profile = getTasteProfile();
    const totalReviews = reviewService.getCurrentUserReviews().length;
    const selfReviews = reviewService.getCurrentUserReviews({ reviewType: REVIEW_TYPES.SELF }).length;
    const otherReviews = reviewService.getCurrentUserReviews({ reviewType: REVIEW_TYPES.OTHER }).length;

    document.getElementById('profile-review-count').textContent = totalReviews;
    document.getElementById('profile-self-count').textContent = selfReviews;
    document.getElementById('profile-other-count').textContent = otherReviews;

    const avgRatingEl = document.getElementById('profile-avg-rating');
    if (avgRatingEl) {
        avgRatingEl.textContent = profile.avgRating.toFixed(1);
    }

    const tastes = [
        { key: 'salty', value: profile.salty },
        { key: 'light', value: profile.light },
        { key: 'oily', value: profile.oily },
        { key: 'spicy', value: profile.spicy }
    ];

    tastes.forEach(taste => {
        const valueEl = document.getElementById(`pref-${taste.key}-value`);
        const descEl = document.getElementById(`pref-${taste.key}-desc`);
        const cardEl = document.getElementById(`pref-${taste.key}`);

        if (taste.value === 0) {
            valueEl.textContent = '--';
            descEl.textContent = '暂无数据';
            cardEl.classList.remove('high', 'medium', 'low');
        } else {
            valueEl.textContent = `${Math.round(taste.value)}%`;
            descEl.textContent = getTasteDescription(taste.value, taste.key);

            cardEl.classList.remove('high', 'medium', 'low');
            if (taste.value >= 60) {
                cardEl.classList.add('high');
            } else if (taste.value >= 30) {
                cardEl.classList.add('medium');
            } else {
                cardEl.classList.add('low');
            }
        }
    });

    drawRadarChart(profile);
    renderSuggestion(profile);
}

function renderSuggestion(profile) {
    const suggestionEl = document.getElementById('suggestion-text');
    const tastes = [
        { key: 'salty', name: '咸', high: '高盐饮食不利于健康，建议适当控制盐分摄入', low: '可以适当尝试一些咸香菜品，丰富味觉体验' },
        { key: 'light', name: '淡', high: '清淡饮食很健康，继续保持！', low: '偶尔试试清淡菜品，给肠胃减减负' },
        { key: 'oily', name: '油', high: '油腻食物要适量哦，建议多搭配蔬菜水果', low: '偶尔享受一下油香美食也无妨' },
        { key: 'spicy', name: '辣', high: '吃辣很爽但要适度，小心上火哦', low: '可以从微辣开始尝试，体验辣味的魅力' }
    ];

    if (profile.totalReviews < 5) {
        suggestionEl.textContent = `你已点评 ${profile.totalReviews} 道菜，再多点评 ${5 - profile.totalReviews} 道就能获得更精准的口味画像哦！`;
        return;
    }

    let suggestion = '';
    const strongPref = tastes.filter(t => profile[t.key] >= 60);
    const weakPref = tastes.filter(t => profile[t.key] > 0 && profile[t.key] < 30);

    if (strongPref.length > 0) {
        const pref = strongPref[0];
        suggestion = `你${pref.name}味偏好较强，${pref.high}。`;
    }

    if (weakPref.length > 0) {
        const pref = weakPref[0];
        if (suggestion) {
            suggestion += ' 另外，' + pref.low + '。';
        } else {
            suggestion = pref.low + '。';
        }
    }

    if (!suggestion) {
        const balancedPref = tastes.filter(t => profile[t.key] >= 30 && profile[t.key] < 60);
        if (balancedPref.length >= 3) {
            suggestion = '你的口味比较均衡，不挑食是个好习惯！继续保持多样化的饮食结构。';
        } else {
            suggestion = '你的口味很有特点，继续探索更多美食吧！';
        }
    }

    suggestion += ` 你已点评 ${profile.totalReviews} 道菜，平均评分 ${profile.avgRating.toFixed(1)} 星。`;
    suggestionEl.textContent = suggestion;
}

function getRecommendedDishes() {
    const priorMean = getOverallAverageRating();
    return reviewService.getRecommendedDishes(dishes, reviewService.currentUserId, priorMean);
}

function getAvoidList() {
    return reviewService.getAvoidList(dishes, 7, 3);
}

function renderStars(rating, size = 'small') {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '★';
    }
    if (hasHalf) {
        stars += '☆';
    }
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '☆';
    }

    return `<span class="rating-stars">${stars}</span>`;
}

function renderDishCard(dish, showRank = false, rank = 0, isAvoid = false) {
    const avgRating = getDishAverageRating(dish.id);
    const reviewCount = getDishReviews(dish.id).length;
    const tagCloud = getDishTagCloud(dish.id);

    const windowInfo = WINDOWS.find(w => w.id === dish.windowId);

    let tagsHtml = '';
    if (tagCloud.length > 0) {
        tagsHtml = '<div class="tag-cloud">';
        tagCloud.slice(0, 5).forEach(tagInfo => {
            const sizeClass = getTagSizeClass(tagInfo.percentage);
            const colors = TAG_COLORS[tagInfo.tag] || { bg: '#f5f5f5', color: '#666' };
            tagsHtml += `<span class="tag-item ${sizeClass}" style="background: ${colors.bg}; color: ${colors.color};">${tagInfo.tag} (${tagInfo.count})</span>`;
        });
        tagsHtml += '</div>';
    }

    const displayRating = dish.avgRating !== undefined ? dish.avgRating : avgRating;
    const displayCount = dish.reviewCount !== undefined ? dish.reviewCount : reviewCount;

    const bayesianBadge = isAvoid ? `<span class="bayesian-badge" title="贝叶斯平均评分，评价数越少越接近整体平均分">📊 贝叶斯评分</span>` : '';

    return `
        <div class="dish-card ${isAvoid ? 'avoid' : ''}" data-dish-id="${dish.id}">
            ${showRank ? `<div class="dish-rank">${rank}</div>` : ''}
            <div class="dish-image">${dish.emoji || '🍽️'}</div>
            <div class="dish-info">
                <div class="dish-name">${dish.name} ${bayesianBadge}</div>
                <div class="dish-window">${windowInfo.icon} ${windowInfo.name}</div>
                <div class="dish-stats">
                    <div class="dish-rating">
                        <span class="rating-score">${displayRating.toFixed(1)}</span>
                        ${renderStars(displayRating)}
                        <span class="rating-count">(${displayCount}条点评)</span>
                    </div>
                    <button class="review-btn" onclick="event.stopPropagation(); openReviewModal('${dish.id}')">
                        写点评
                    </button>
                </div>
                ${tagsHtml}
            </div>
        </div>
    `;
}

function renderWindowFilters() {
    const container = document.getElementById('window-filters');
    let html = '<button class="window-filter-btn active" data-window="all">全部窗口</button>';

    WINDOWS.forEach(window => {
        html += `<button class="window-filter-btn" data-window="${window.id}">${window.icon} ${window.name}</button>`;
    });

    container.innerHTML = html;

    container.querySelectorAll('.window-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.window-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentWindowFilter = btn.dataset.window;
            renderAllDishes();
        });
    });
}

function renderAllDishes() {
    const grid = document.getElementById('all-grid');
    let filteredDishes = dishes;

    if (currentWindowFilter !== 'all') {
        filteredDishes = dishes.filter(d => d.windowId === currentWindowFilter);
    }

    if (filteredDishes.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="icon">🍽️</div>
                <p>该窗口暂无菜品</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredDishes.map(dish => renderDishCard(dish)).join('');
}

function renderRecommendedDishes() {
    const grid = document.getElementById('recommend-grid');
    const preference = getUserPreference();
    const preferenceInfo = document.getElementById('recommend-preference');

    if (preference) {
        const tagsHtml = preference.tags.map(t => `<span class="pref-tag">${t.tag}</span>`).join('');
        preferenceInfo.innerHTML = `
            <div class="icon">💡</div>
            <div>
                <div class="text">根据你过去 ${preference.totalReviews} 条点评，你可能喜欢：</div>
                <div class="tags">${tagsHtml}</div>
            </div>
        `;
    } else {
        preferenceInfo.innerHTML = `
            <div class="icon">✨</div>
            <div>
                <div class="text">你还没有点评记录，先试试这些热门菜品吧！</div>
            </div>
        `;
    }

    const recommended = getRecommendedDishes();
    grid.innerHTML = recommended.map(dish => renderDishCard(dish)).join('');
}

function renderAvoidList() {
    const grid = document.getElementById('avoid-grid');
    const avoidList = getAvoidList();

    if (avoidList.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="icon">🎉</div>
                <p>太棒了！最近7天没有需要避雷的菜品</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = avoidList.map((dish, index) => renderDishCard(dish, true, index + 1, true)).join('');
}

function openReviewModal(dishId) {
    currentDishId = dishId;
    const dish = dishes.find(d => d.id === dishId);
    document.getElementById('modal-dish-name').textContent = `点评「${dish.name}」`;
    document.getElementById('review-modal').classList.add('active');

    selectedRating = 0;
    selectedReviewType = REVIEW_TYPES.SELF;
    document.querySelectorAll('.star').forEach(star => {
        star.classList.remove('active', 'hover');
    });
    document.getElementById('rating-text').textContent = '请选择评分';

    document.querySelectorAll('.tag-option input').forEach(input => {
        input.checked = false;
    });
    document.getElementById('review-comment').value = '';

    document.querySelectorAll('.review-type-option input').forEach(input => {
        input.checked = input.value === REVIEW_TYPES.SELF;
    });
}

function closeModal() {
    document.getElementById('review-modal').classList.remove('active');
    currentDishId = null;
    selectedRating = 0;
    selectedReviewType = REVIEW_TYPES.SELF;
}

function submitReview() {
    if (selectedRating === 0) {
        alert('请选择评分');
        return;
    }

    const selectedTags = Array.from(document.querySelectorAll('.tag-option input:checked'))
        .map(input => input.value);
    const comment = document.getElementById('review-comment').value.trim();
    const reviewTypeInput = document.querySelector('.review-type-option input:checked');
    const reviewType = reviewTypeInput ? reviewTypeInput.value : REVIEW_TYPES.SELF;

    reviewService.addReview({
        dishId: currentDishId,
        rating: selectedRating,
        tags: selectedTags,
        comment,
        reviewType
    });

    closeModal();
    renderAllDishes();
    renderRecommendedDishes();
    renderAvoidList();
    renderTasteProfile();

    alert('点评提交成功！感谢你的反馈');
}

function initStarRating() {
    const stars = document.querySelectorAll('.star-rating .star');

    stars.forEach((star, index) => {
        star.addEventListener('mouseenter', () => {
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.classList.add('hover');
                } else {
                    s.classList.remove('hover');
                }
            });
        });

        star.addEventListener('mouseleave', () => {
            stars.forEach(s => s.classList.remove('hover'));
        });

        star.addEventListener('click', () => {
            selectedRating = index + 1;
            stars.forEach((s, i) => {
                if (i < selectedRating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
            document.getElementById('rating-text').textContent = `${selectedRating}星 - ${RATING_TEXTS[selectedRating - 1]}`;
        });
    });
}

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tab}-section`).classList.add('active');

            if (tab === 'recommend') {
                renderRecommendedDishes();
            } else if (tab === 'avoid') {
                renderAvoidList();
            } else if (tab === 'profile') {
                renderTasteProfile();
            }
        });
    });
}

function initModalClose() {
    document.getElementById('review-modal').addEventListener('click', (e) => {
        if (e.target.id === 'review-modal') {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function demoBayesianAverage() {
    const priorMean = getOverallAverageRating();
    console.log('=== 贝叶斯平均算法演示 ===');
    console.log(`整体先验平均分: ${priorMean.toFixed(2)}`);
    console.log('权重: 5 (评价数越少，评分越接近整体平均分)');
    console.log('');

    const demoCases = [
        { ratings: [1], desc: '1条差评(1星)' },
        { ratings: [1, 1], desc: '2条差评(1星)' },
        { ratings: [1, 1, 1], desc: '3条差评(1星)' },
        { ratings: [5], desc: '1条好评(5星)' },
        { ratings: [5, 5], desc: '2条好评(5星)' },
        { ratings: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], desc: '10条差评(1星)' },
        { ratings: [3, 3, 4, 4, 5, 5], desc: '6条中等评价' }
    ];

    console.log('对比示例:');
    console.log('| 评价情况               | 简单平均 | 贝叶斯平均 |');
    console.log('|------------------------|----------|------------|');

    demoCases.forEach(item => {
        const simpleAvg = item.ratings.reduce((a, b) => a + b, 0) / item.ratings.length;
        const bayesianAvg = getBayesianAverage(item.ratings, priorMean, 5);
        console.log(`| ${item.desc.padEnd(22)} | ${simpleAvg.toFixed(2).padStart(8)} | ${bayesianAvg.toFixed(2).padStart(10)} |`);
    });

    console.log('');
    console.log('结论: 评价数越少，贝叶斯平均越接近整体平均分，避免极端评分异常影响排名');
}

function init() {
    initData();
    initTabs();
    initWindowFilters();
    initStarRating();
    initModalClose();

    renderAllDishes();
    renderRecommendedDishes();
    renderAvoidList();
    renderTasteProfile();

    setTimeout(demoBayesianAverage, 500);
}

document.addEventListener('DOMContentLoaded', init);
