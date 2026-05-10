package com.express.station.util;

import com.express.station.repository.ParcelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
@RequiredArgsConstructor
public class PickupCodeGenerator {

    private final ParcelRepository parcelRepository;
    private static final String CHARACTERS = "0123456789";
    private static final int CODE_LENGTH = 6;
    private static final int MAX_RETRIES = 100;

    public String generatePickupCode() {
        SecureRandom random = new SecureRandom();
        for (int i = 0; i < MAX_RETRIES; i++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int j = 0; j < CODE_LENGTH; j++) {
                sb.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
            }
            String code = sb.toString();
            if (!parcelRepository.existsByPickupCode(code)) {
                return code;
            }
        }
        throw new RuntimeException("无法生成唯一取件码，请重试");
    }

    public String generateCellCode(Integer row, Integer col) {
        if (row == null || col == null) {
            return null;
        }
        return String.format("%d-%02d", row, col);
    }
}
