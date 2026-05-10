package com.example.lostfound.util;

public class TextSimilarityUtil {

    public static double levenshteinSimilarity(String str1, String str2) {
        if (str1 == null || str2 == null) return 0.0;
        if (str1.equals(str2)) return 1.0;

        int maxLength = Math.max(str1.length(), str2.length());
        if (maxLength == 0) return 1.0;

        int distance = levenshteinDistance(str1, str2);
        return 1.0 - (double) distance / maxLength;
    }

    private static int levenshteinDistance(String str1, String str2) {
        int len1 = str1.length();
        int len2 = str2.length();

        if (len1 == 0) return len2;
        if (len2 == 0) return len1;

        int[][] dp = new int[len1 + 1][len2 + 1];

        for (int i = 0; i <= len1; i++) dp[i][0] = i;
        for (int j = 0; j <= len2; j++) dp[0][j] = j;

        for (int i = 1; i <= len1; i++) {
            for (int j = 1; j <= len2; j++) {
                int cost = (str1.charAt(i - 1) == str2.charAt(j - 1)) ? 0 : 1;
                dp[i][j] = Math.min(
                    Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                    dp[i - 1][j - 1] + cost
                );
            }
        }

        return dp[len1][len2];
    }

    public static double jaccardSimilarity(String str1, String str2) {
        if (str1 == null || str2 == null) return 0.0;
        if (str1.equals(str2)) return 1.0;

        int intersection = 0;
        for (int i = 0; i < str1.length(); i++) {
            char c = str1.charAt(i);
            if (str2.indexOf(c) != -1) {
                intersection++;
            }
        }

        int union = str1.length() + str2.length() - intersection;
        if (union == 0) return 1.0;

        return (double) intersection / union;
    }

    public static double combinedSimilarity(String str1, String str2) {
        if (str1 == null || str2 == null) return 0.0;
        str1 = str1.toLowerCase();
        str2 = str2.toLowerCase();

        double lev = levenshteinSimilarity(str1, str2);
        double jacc = jaccardSimilarity(str1, str2);

        return lev * 0.7 + jacc * 0.3;
    }

    public static boolean containsKeyword(String text, String keyword) {
        if (text == null || keyword == null) return false;
        return text.toLowerCase().contains(keyword.toLowerCase());
    }
}
