package com.quiz.controller;

import com.quiz.entity.AudienceVote;
import com.quiz.service.AudienceService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/audience")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowCredentials = "true")
public class AudienceController {

    private final AudienceService audienceService;
    private static final String AUDIENCE_COOKIE_NAME = "quiz_audience_id";
    private static final int COOKIE_MAX_AGE = 24 * 60 * 60;

    private String getOrCreateAudienceId(HttpServletRequest request, HttpServletResponse response) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (AUDIENCE_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        String audienceId = UUID.randomUUID().toString().replace("-", "");
        Cookie cookie = new Cookie(AUDIENCE_COOKIE_NAME, audienceId);
        cookie.setMaxAge(COOKIE_MAX_AGE);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        response.addCookie(cookie);
        return audienceId;
    }

    @GetMapping("/competitions/{competitionId}/heat")
    public ResponseEntity<?> getCompetitionHeat(@PathVariable Long competitionId) {
        try {
            Map<String, Object> heat = audienceService.getCompetitionHeat(competitionId);
            return ResponseEntity.ok(heat);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/competitions/{competitionId}/vote")
    public ResponseEntity<?> vote(
            @PathVariable Long competitionId,
            @RequestParam Long teamId,
            @RequestParam(required = false, defaultValue = "LIKE") String voteType,
            HttpServletRequest request,
            HttpServletResponse response) {
        try {
            String audienceSession = getOrCreateAudienceId(request, response);
            AudienceVote.VoteType type = AudienceVote.VoteType.valueOf(voteType.toUpperCase());
            Map<String, Object> result = audienceService.vote(competitionId, teamId, audienceSession, type);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid vote type: " + voteType);
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/competitions/{competitionId}/like")
    public ResponseEntity<?> like(
            @PathVariable Long competitionId,
            @RequestParam Long teamId,
            HttpServletRequest request,
            HttpServletResponse response) {
        return vote(competitionId, teamId, "LIKE", request, response);
    }

    @PostMapping("/competitions/{competitionId}/cheer")
    public ResponseEntity<?> cheer(
            @PathVariable Long competitionId,
            @RequestParam Long teamId,
            HttpServletRequest request,
            HttpServletResponse response) {
        return vote(competitionId, teamId, "CHEER", request, response);
    }

    @PostMapping("/competitions/{competitionId}/fire")
    public ResponseEntity<?> fire(
            @PathVariable Long competitionId,
            @RequestParam Long teamId,
            HttpServletRequest request,
            HttpServletResponse response) {
        return vote(competitionId, teamId, "FIRE", request, response);
    }

    @GetMapping("/vote-types")
    public ResponseEntity<?> getVoteTypes() {
        Map<String, Object> result = new HashMap<>();
        result.put("types", new Object[]{
                Map.of("type", "LIKE", "name", "点赞", "points", 1, "description", "普通点赞"),
                Map.of("type", "CHEER", "name", "打call", "points", 5, "description", "热情打call"),
                Map.of("type", "FIRE", "name", "火箭", "points", 10, "description", "强力应援")
        });
        return ResponseEntity.ok(result);
    }
}
