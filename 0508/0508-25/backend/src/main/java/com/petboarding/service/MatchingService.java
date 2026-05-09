package com.petboarding.service;

import com.petboarding.entity.BoardingCenter;
import com.petboarding.entity.Pet;
import com.petboarding.entity.Room;
import com.petboarding.repository.BoardingCenterRepository;
import com.petboarding.repository.PetRepository;
import com.petboarding.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class MatchingService {
    
    private final PetRepository petRepository;
    private final RoomRepository roomRepository;
    private final BoardingCenterRepository boardingCenterRepository;
    private final OccupancyCacheService occupancyCacheService;
    private final BookingService bookingService;
    
    private static final Set<String> LARGE_SPACE_KEYWORDS = Set.of(
            "大空间", "大房间", "需要空间", "宽敞", "活动空间", "large", "spacious"
    );
    
    private static final Set<String> AFRAID_OF_CATS_KEYWORDS = Set.of(
            "怕猫", "不喜欢猫", "害怕猫", "afraid of cat", "hate cat"
    );
    
    private static final Set<String> AFRAID_OF_DOGS_KEYWORDS = Set.of(
            "怕狗", "不喜欢狗", "害怕狗", "afraid of dog", "hate dog"
    );
    
    private static final Set<String> NEEDS_AIR_CONDITIONING_KEYWORDS = Set.of(
            "空调", "怕热", "需要凉爽", "air condition", "cool"
    );
    
    private static final Set<String> NEEDS_SWIMMING_KEYWORDS = Set.of(
            "游泳", "泳池", "喜欢水", "swim", "pool", "water"
    );
    
    private static final Set<String> NEEDS_QUIET_KEYWORDS = Set.of(
            "安静", "怕吵", "喜欢安静", "quiet", "silent", "peaceful"
    );
    
    public List<RoomRecommendation> findBestRooms(Long petId, LocalDate startDate, LocalDate endDate) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new RuntimeException("Pet not found"));
        
        List<Room> allRooms = roomRepository.findAll();
        Map<Long, BoardingCenter> centerMap = boardingCenterRepository.findAll().stream()
                .collect(Collectors.toMap(BoardingCenter::getCenterId, c -> c));
        
        List<RoomRecommendation> recommendations = new ArrayList<>();
        
        for (Room room : allRooms) {
            try {
                if (!bookingService.isRoomAvailable(room.getRoomId(), startDate, endDate)) {
                    continue;
                }
                
                double matchScore = calculateMatchScore(pet, room, centerMap.get(room.getCenterId()));
                
                if (matchScore > 0) {
                    recommendations.add(RoomRecommendation.builder()
                            .room(room)
                            .center(centerMap.get(room.getCenterId()))
                            .matchScore(matchScore)
                            .matchReasons(getMatchReasons(pet, room, centerMap.get(room.getCenterId())))
                            .build());
                }
            } catch (Exception e) {
                log.warn("Error evaluating room {}: {}", room.getRoomId(), e.getMessage());
            }
        }
        
        recommendations.sort((a, b) -> Double.compare(b.getMatchScore(), a.getMatchScore()));
        
        return recommendations;
    }
    
    private double calculateMatchScore(Pet pet, Room room, BoardingCenter center) {
        double score = 50.0;
        
        if (!isPetTypeCompatible(pet, room)) {
            return 0;
        }
        score += 10;
        
        if (!isPetSizeCompatible(pet, room)) {
            return 0;
        }
        score += 10;
        
        score += evaluateSpecialNeeds(pet, room, center);
        
        score += evaluateRoomFeatures(room, center);
        
        if (center != null && center.getFacilities() != null) {
            String facilities = center.getFacilities().toLowerCase();
            if (facilities.contains("空调") || facilities.contains("air")) {
                score += 5;
            }
            if (facilities.contains("监控") || facilities.contains("security")) {
                score += 3;
            }
            if (facilities.contains("专人")) {
                score += 5;
            }
        }
        
        return Math.min(score, 100.0);
    }
    
    private boolean isPetTypeCompatible(Pet pet, Room room) {
        String suitableFor = room.getSuitableForPetType();
        if (suitableFor == null || suitableFor.isEmpty()) {
            return true;
        }
        return suitableFor.contains(pet.getType().name());
    }
    
    private boolean isPetSizeCompatible(Pet pet, Room room) {
        if (room.getMaxSize() == null) {
            return true;
        }
        
        int petSizeOrder = getSizeOrder(pet.getSize());
        int roomMaxSizeOrder = getSizeOrder(room.getMaxSize());
        
        return petSizeOrder <= roomMaxSizeOrder;
    }
    
    private int getSizeOrder(Pet.PetSize size) {
        return switch (size) {
            case SMALL -> 1;
            case MEDIUM -> 2;
            case LARGE -> 3;
        };
    }
    
    private double evaluateSpecialNeeds(Pet pet, Room room, BoardingCenter center) {
        if (pet.getSpecialNeeds() == null || pet.getSpecialNeeds().isEmpty()) {
            return 0;
        }
        
        double score = 0;
        String specialNeeds = pet.getSpecialNeeds().toLowerCase();
        String roomFeatures = room.getSpecialFeatures() != null ? 
                room.getSpecialFeatures().toLowerCase() : "";
        String centerFacilities = center != null && center.getFacilities() != null ? 
                center.getFacilities().toLowerCase() : "";
        
        if (containsAnyKeyword(specialNeeds, LARGE_SPACE_KEYWORDS)) {
            if (room.getCapacity() >= 2 || room.getName().contains("豪华") || 
                    room.getName().contains("large") || room.getName().contains("big")) {
                score += 10;
            } else {
                score -= 5;
            }
        }
        
        if (containsAnyKeyword(specialNeeds, AFRAID_OF_CATS_KEYWORDS)) {
            String suitableFor = room.getSuitableForPetType();
            if (suitableFor != null && !suitableFor.contains("CAT")) {
                score += 10;
            } else if (suitableFor != null && suitableFor.contains("CAT") && suitableFor.contains("DOG")) {
                score -= 5;
            }
        }
        
        if (containsAnyKeyword(specialNeeds, AFRAID_OF_DOGS_KEYWORDS)) {
            String suitableFor = room.getSuitableForPetType();
            if (suitableFor != null && !suitableFor.contains("DOG")) {
                score += 10;
            } else if (suitableFor != null && suitableFor.contains("CAT") && suitableFor.contains("DOG")) {
                score -= 5;
            }
        }
        
        if (containsAnyKeyword(specialNeeds, NEEDS_AIR_CONDITIONING_KEYWORDS)) {
            if (roomFeatures.contains("空调") || roomFeatures.contains("air") ||
                    centerFacilities.contains("空调") || centerFacilities.contains("air")) {
                score += 10;
            } else {
                score -= 5;
            }
        }
        
        if (containsAnyKeyword(specialNeeds, NEEDS_SWIMMING_KEYWORDS)) {
            if (roomFeatures.contains("泳池") || roomFeatures.contains("pool") ||
                    centerFacilities.contains("泳池") || centerFacilities.contains("pool")) {
                score += 10;
            }
        }
        
        if (containsAnyKeyword(specialNeeds, NEEDS_QUIET_KEYWORDS)) {
            if (room.getName().contains("独立") || room.getName().contains("private") ||
                    room.getCapacity() == 1) {
                score += 10;
            }
        }
        
        return score;
    }
    
    private double evaluateRoomFeatures(Room room, BoardingCenter center) {
        double score = 0;
        
        String features = room.getSpecialFeatures() != null ? 
                room.getSpecialFeatures().toLowerCase() : "";
        
        if (features.contains("玩具") || features.contains("toy")) {
            score += 3;
        }
        if (features.contains("猫爬架") || features.contains("cat tree")) {
            score += 5;
        }
        if (features.contains("大床") || features.contains("bed")) {
            score += 3;
        }
        
        return score;
    }
    
    private boolean containsAnyKeyword(String text, Set<String> keywords) {
        String lowerText = text.toLowerCase();
        for (String keyword : keywords) {
            if (lowerText.contains(keyword.toLowerCase())) {
                return true;
            }
        }
        return false;
    }
    
    private List<String> getMatchReasons(Pet pet, Room room, BoardingCenter center) {
        List<String> reasons = new ArrayList<>();
        
        if (isPetTypeCompatible(pet, room)) {
            reasons.add("房间类型适合您的宠物");
        }
        
        if (isPetSizeCompatible(pet, room)) {
            reasons.add("房间大小适合您的宠物体型");
        }
        
        if (pet.getSpecialNeeds() != null && !pet.getSpecialNeeds().isEmpty()) {
            String specialNeeds = pet.getSpecialNeeds().toLowerCase();
            String roomFeatures = room.getSpecialFeatures() != null ? 
                    room.getSpecialFeatures().toLowerCase() : "";
            String centerFacilities = center != null && center.getFacilities() != null ? 
                    center.getFacilities().toLowerCase() : "";
            
            if (containsAnyKeyword(specialNeeds, NEEDS_AIR_CONDITIONING_KEYWORDS) &&
                    (roomFeatures.contains("空调") || centerFacilities.contains("空调"))) {
                reasons.add("配备空调，满足怕热需求");
            }
            
            if (containsAnyKeyword(specialNeeds, NEEDS_SWIMMING_KEYWORDS) &&
                    (roomFeatures.contains("泳池") || centerFacilities.contains("泳池"))) {
                reasons.add("配备泳池，满足游泳需求");
            }
            
            if (containsAnyKeyword(specialNeeds, NEEDS_QUIET_KEYWORDS) && room.getCapacity() == 1) {
                reasons.add("独立房间，环境安静");
            }
        }
        
        if (room.getCapacity() >= 2) {
            reasons.add("宽敞大空间");
        }
        
        return reasons;
    }
    
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RoomRecommendation {
        private Room room;
        private BoardingCenter center;
        private double matchScore;
        private List<String> matchReasons;
    }
}
