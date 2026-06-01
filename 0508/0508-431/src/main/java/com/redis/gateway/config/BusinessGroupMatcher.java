package com.redis.gateway.config;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.concurrent.TimeUnit;

public class BusinessGroupMatcher {
    private static final Logger logger = LoggerFactory.getLogger(BusinessGroupMatcher.class);
    private static final int DEFAULT_CACHE_SIZE = 10000;
    private static final int DEFAULT_CACHE_TTL_SECONDS = 60;

    private final TrieNode root;
    private final Cache<String, GatewayConfig.BusinessGroupConfig> cache;
    private volatile GatewayConfig.BusinessGroupConfig defaultGroup;

    public BusinessGroupMatcher() {
        this.root = new TrieNode();
        this.cache = CacheBuilder.newBuilder()
                .maximumSize(DEFAULT_CACHE_SIZE)
                .expireAfterWrite(DEFAULT_CACHE_TTL_SECONDS, TimeUnit.SECONDS)
                .build();
    }

    public void loadBusinessGroups(List<GatewayConfig.BusinessGroupConfig> groups) {
        cache.invalidateAll();
        clearTrie();
        defaultGroup = null;

        for (GatewayConfig.BusinessGroupConfig group : groups) {
            for (String prefix : group.getPrefixes()) {
                if ("*".equals(prefix)) {
                    defaultGroup = group;
                } else {
                    String cleanPrefix = prefix.replace("*", "");
                    insert(cleanPrefix, group);
                }
            }
        }
        logger.info("Business group matcher loaded {} groups", groups.size());
    }

    private void insert(String prefix, GatewayConfig.BusinessGroupConfig group) {
        TrieNode node = root;
        for (char c : prefix.toCharArray()) {
            int index = getCharIndex(c);
            if (node.children[index] == null) {
                node.children[index] = new TrieNode();
            }
            node = node.children[index];
        }
        node.endOfWord = true;
        node.group = group;
    }

    public GatewayConfig.BusinessGroupConfig match(String key) {
        GatewayConfig.BusinessGroupConfig cached = cache.getIfPresent(key);
        if (cached != null) {
            return cached;
        }

        GatewayConfig.BusinessGroupConfig result = findLongestMatch(key);
        if (result == null) {
            result = defaultGroup;
        }

        if (result != null) {
            cache.put(key, result);
        }
        return result;
    }

    private GatewayConfig.BusinessGroupConfig findLongestMatch(String key) {
        TrieNode node = root;
        GatewayConfig.BusinessGroupConfig longestMatch = null;

        for (int i = 0; i < key.length(); i++) {
            char c = key.charAt(i);
            int index = getCharIndex(c);
            if (node.children[index] == null) {
                break;
            }
            node = node.children[index];
            if (node.endOfWord) {
                longestMatch = node.group;
            }
        }
        return longestMatch;
    }

    private int getCharIndex(char c) {
        if (c >= 'a' && c <= 'z') {
            return c - 'a';
        } else if (c >= 'A' && c <= 'Z') {
            return c - 'A' + 26;
        } else if (c >= '0' && c <= '9') {
            return c - '0' + 52;
        } else if (c == ':') {
            return 62;
        } else if (c == '_') {
            return 63;
        } else if (c == '-') {
            return 64;
        } else if (c == '.') {
            return 65;
        } else {
            return 66;
        }
    }

    private void clearTrie() {
        for (int i = 0; i < root.children.length; i++) {
            root.children[i] = null;
        }
    }

    public void invalidateCache() {
        cache.invalidateAll();
    }

    public long getCacheSize() {
        return cache.size();
    }

    private static class TrieNode {
        TrieNode[] children = new TrieNode[67];
        boolean endOfWord = false;
        GatewayConfig.BusinessGroupConfig group;
    }
}
