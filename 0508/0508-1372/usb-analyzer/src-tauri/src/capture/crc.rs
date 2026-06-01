const CRC32C_TABLE: [u32; 256] = {
    let mut table = [0u32; 256];
    let poly: u32 = 0x82F63B78;
    let mut i = 0u32;
    while i < 256 {
        let mut crc = i;
        let mut j = 0;
        while j < 8 {
            if crc & 1 != 0 {
                crc = (crc >> 1) ^ poly;
            } else {
                crc >>= 1;
            }
            j += 1;
        }
        table[i as usize] = crc;
        i += 1;
    }
    table
};

pub fn crc32c(data: &[u8]) -> u32 {
    let mut crc: u32 = 0xFFFFFFFF;
    for &byte in data {
        let idx = ((crc ^ byte as u32) & 0xFF) as usize;
        crc = (crc >> 8) ^ CRC32C_TABLE[idx];
    }
    !crc
}

pub fn crc32c_with_init(init: u32, data: &[u8]) -> u32 {
    let mut crc = init;
    for &byte in data {
        let idx = ((crc ^ byte as u32) & 0xFF) as usize;
        crc = (crc >> 8) ^ CRC32C_TABLE[idx];
    }
    crc
}

pub fn verify_crc32c(data: &[u8], expected: u32) -> bool {
    crc32c(data) == expected
}

pub fn verify_crc32c_append(data_with_crc: &[u8]) -> bool {
    if data_with_crc.len() < 4 {
        return true;
    }
    let payload = &data_with_crc[..data_with_crc.len() - 4];
    let stored_crc = u32::from_le_bytes([
        data_with_crc[data_with_crc.len() - 4],
        data_with_crc[data_with_crc.len() - 3],
        data_with_crc[data_with_crc.len() - 2],
        data_with_crc[data_with_crc.len() - 1],
    ]);
    crc32c(payload) == stored_crc
}

pub fn corrupt_crc32c(correct_crc: u32, error_pattern: u32) -> u32 {
    correct_crc ^ error_pattern
}

pub fn extract_crc32c(data_with_crc: &[u8]) -> Option<u32> {
    if data_with_crc.len() < 4 {
        return None;
    }
    Some(u32::from_le_bytes([
        data_with_crc[data_with_crc.len() - 4],
        data_with_crc[data_with_crc.len() - 3],
        data_with_crc[data_with_crc.len() - 2],
        data_with_crc[data_with_crc.len() - 1],
    ]))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_crc32c_known_vector() {
        assert_eq!(crc32c(b"123456789"), 0xE3069283);
    }

    #[test]
    fn test_crc32c_empty() {
        assert_eq!(crc32c(b""), 0x00000000);
    }

    #[test]
    fn test_verify_roundtrip() {
        let data = b"USB 3.0 SuperSpeed payload data";
        let computed = crc32c(data);
        assert!(verify_crc32c(data, computed));
    }

    #[test]
    fn test_corrupt_produces_different_crc() {
        let correct = crc32c(b"test data");
        let corrupted = corrupt_crc32c(correct, 0xDEADBEEF);
        assert_ne!(correct, corrupted);
        assert_eq!(corrupted, correct ^ 0xDEADBEEF);
    }

    #[test]
    fn test_extract_and_verify() {
        let payload = b"USB payload";
        let crc = crc32c(payload);
        let mut data_with_crc = payload.to_vec();
        data_with_crc.extend_from_slice(&crc.to_le_bytes());
        assert!(verify_crc32c_append(&data_with_crc));
        assert_eq!(extract_crc32c(&data_with_crc), Some(crc));
    }
}
