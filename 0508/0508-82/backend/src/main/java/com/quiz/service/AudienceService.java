package com.quiz.service;

import com.quiz.dto.WebSocketMessage;
import com.quiz.entity.AudienceVote;
import com.quiz.entity.Competition;
import com.quiz.entity.Team;
import com.quiz.repository.AudienceVoteRepository;
import com.quiz.repository.CompetitionRepository;
import com.quiz.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AudienceService {

    private final AudienceVoteRepository audienceVoteRepository;
    private final CompetitionRepository competitionRepository;
    private final TeamRepository teamRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String VOTE_LIMIT_PREFIX = "quiz:vote_limit:";
    private static final String HEAT_CACHE_PREFIX = "quiz:heat:";
    private static final int VOTE_COOLDOWN_SECONDS = 3;
    private static final int MAX_VOTES_PER_MINUTE = 20;

    public Map<String, Object> vote(Long competitionId, Long teamId, String audienceSession, AudienceVote.VoteType voteType) {
        Map<String, Object> result = new HashMap<>();

        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (!team.getCompetitionId().equals(competitionId)) {
            throw new RuntimeException("Team does not belong to this competition");
        }

        if (competition.getStatus().name().equals("FINISHED")) {
            throw new RuntimeException("Competition has finished");
        }

        String limitKey = VOTE_LIMIT_PREFIX + competitionId + ":" + audienceSession;
        String rateKey = limitKey + ":rate";

        Long remaining = redisTemplate.getExpire(limitKey, TimeUnit.SECONDS);
        if (remaining != null && remaining > 0) {
            result.put("success", false);
            result.put("message", "投票太频繁，请稍候");
            result.put("cooldown", remaining);
            return result;
        }

        Long recentCount = redisTemplate.opsForValue().increment(rateKey, 1);
        if (recentCount == 1) {
            redisTemplate.expire(rateKey, 60, TimeUnit.SECONDS);
        }
        if (recentCount != null && recentCount > MAX_VOTES_PER_MINUTE) {
            result.put("success", false);
            result.put("message", "投票次数过多，请稍后再试");
            return result;
        }

        AudienceVote vote = AudienceVote.builder()
                .competitionId(competitionId)
                .teamId(teamId)
                .audienceSession(audienceSession)
                .voteType(voteType)
                .points(voteType.getPoints())
                .build();
        audienceVoteRepository.save(vote);

        redisTemplate.opsForValue().set(limitKey, 1, VOTE_COOLDOWN_SECONDS, TimeUnit.SECONDS);

        String heatKey = HEAT_CACHE_PREFIX + competitionId + ":" + teamId;
        redisTemplate.opsForValue().increment(heatKey, voteType.getPoints());
        redisTemplate.expire(heatKey, 24, TimeUnit.HOURS);

        Map<String, Object> broadcastData = new HashMap<>();
        broadcastData.put("teamId", teamId);
        broadcastData.put("teamName", team.getName());
        broadcastData.put("voteType", voteType.name());
        broadcastData.put("points", voteType.getPoints());
        broadcastData.put("heatScore", getTeamHeat(competitionId, teamId));
        broadcastMessage(competitionId, "AUDIENCE_VOTE", broadcastData);

        result.put("success", true);
        result.put("message", "投票成功！");
        result.put("teamName", team.getName());
        result.put("voteType", voteType.name());
        result.put("points", voteType.getPoints());

        log.info("Audience vote: competition={}, team={}, type={}, session={}",
                competitionId, teamId, voteType, audienceSession);

        return result;
    }

    public Map<String, Object> getCompetitionHeat(Long competitionId) {
        Map<String, Object> result = new HashMap<>();
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        List<Team> teams = teamRepository.findByCompetitionIdOrderByScoreDesc(competitionId);
        List<Map<String, Object>> teamHeats = new ArrayList<>();

        long totalVotes = 0;
        long totalHeat = 0;

        for (Team team : teams) {
            Map<String, Object> heatData = new HashMap<>();
            long teamHeat = getTeamHeat(competitionId, team.getId());
            long teamVotes = getTeamVotes(competitionId, team.getId());

            heatData.put("teamId", team.getId());
            heatData.put("teamName", team.getName());
            heatData.put("heatScore", teamHeat);
            heatData.put("voteCount", teamVotes);

            teamHeats.add(heatData);
            totalHeat += teamHeat;
            totalVotes += teamVotes;
        }

        teamHeats.sort((a, b) -> Long.compare(
                ((Number) b.get("heatScore")).longValue(),
                ((Number) a.get("heatScore")).longValue()
        ));

        if (!teamHeats.isEmpty()) {
            teamHeats.get(0).put("isLeader", true);
        }

        result.put("competitionId", competitionId);
        result.put("competitionName", competition.getName());
        result.put("status", competition.getStatus());
        result.put("totalVotes", totalVotes);
        result.put("totalHeat", totalHeat);
        result.put("teams", teamHeats);

        return result;
    }

    private long getTeamHeat(Long competitionId, Long teamId) {
        String heatKey = HEAT_CACHE_PREFIX + competitionId + ":" + teamId;
        Object cached = redisTemplate.opsForValue().get(heatKey);

        if (cached != null) {
            return Long.parseLong(cached.toString());
        }

        List<Object[]> pointsList = audienceVoteRepository.sumPointsByCompetitionGroupByTeam(competitionId);
        for (Object[] row : pointsList) {
            Long tid = (Long) row[0];
            if (tid.equals(teamId)) {
                Long points = row[1] != null ? ((Number) row[1]).longValue() : 0L;
                redisTemplate.opsForValue().set(heatKey, points, 24, TimeUnit.HOURS);
                return points;
            }
        }

        return 0;
    }

    private long getTeamVotes(Long competitionId, Long teamId) {
        String votesKey = HEAT_CACHE_PREFIX + "votes:" + competitionId + ":" + teamId;
        Object cached = redisTemplate.opsForValue().get(votesKey);

        if (cached != null) {
            return Long.parseLong(cached.toString());
        }

        List<Object[]> voteList = audienceVoteRepository.countVotesByCompetitionGroupByTeam(competitionId);
        for (Object[] row : voteList) {
            Long tid = (Long) row[0];
            if (tid.equals(teamId)) {
                Long count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
                redisTemplate.opsForValue().set(votesKey, count, 24, TimeUnit.HOURS);
                return count;
            }
        }

        return 0;
    }

    private void broadcastMessage(Long competitionId, String type, Object data) {
        WebSocketMessage message = WebSocketMessage.builder()
                .type(type)
                .data(data)
                .competitionId(competitionId)
                .build();
        messagingTemplate.convertAndSend("/topic/competition/" + competitionId, message);
    }
}
