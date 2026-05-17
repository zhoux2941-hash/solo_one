package com.office.platform.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public class PasswordEncoder {

    private static final String SALT = "office-platform-2024";

    public static String encode(String password) {
        try {
            String saltedPassword = password + SALT;
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(saltedPassword.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("密码加密失败", e);
        }
    }

    public static boolean matches(String rawPassword, String encodedPassword) {
        return encode(rawPassword).equals(encodedPassword);
    }
}