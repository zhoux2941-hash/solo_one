package com.community.station.util;

import org.springframework.util.StringUtils;

public class PhoneUtils {

    private static final String MOBILE_PATTERN = "^1[3-9]\\d{9}$";
    private static final String TEL_PATTERN = "^0\\d{2,3}-?\\d{7,8}$";

    public static boolean isValidMobile(String phone) {
        if (!StringUtils.hasText(phone)) {
            return true;
        }
        String cleanPhone = phone.replaceAll("[^0-9]", "");
        return cleanPhone.matches(MOBILE_PATTERN);
    }

    public static boolean isValidTel(String tel) {
        if (!StringUtils.hasText(tel)) {
            return true;
        }
        return tel.matches(TEL_PATTERN);
    }

    public static boolean isValidPhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return true;
        }
        return isValidMobile(phone) || isValidTel(phone);
    }

    public static String cleanPhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return null;
        }
        return phone.replaceAll("[^0-9]", "");
    }

    public static String formatMobile(String phone) {
        if (!StringUtils.hasText(phone)) {
            return "-";
        }
        String clean = cleanPhone(phone);
        if (clean.length() == 11) {
            return clean.substring(0, 3) + "-" + clean.substring(3, 7) + "-" + clean.substring(7);
        }
        return phone;
    }

    public static String formatTel(String tel) {
        if (!StringUtils.hasText(tel)) {
            return "-";
        }
        String clean = tel.replaceAll("[^0-9]", "");
        if (clean.length() >= 10 && clean.length() <= 12) {
            int areaCodeLen = clean.startsWith("0") ? (clean.length() == 11 ? 3 : 4) : 3;
            return clean.substring(0, areaCodeLen) + "-" + clean.substring(areaCodeLen);
        }
        return tel;
    }

    public static String formatPhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return "-";
        }
        String clean = cleanPhone(phone);
        if (clean.length() == 11 && clean.startsWith("1")) {
            return formatMobile(clean);
        } else if (clean.length() >= 10 && clean.startsWith("0")) {
            return formatTel(clean);
        }
        return phone;
    }
}
