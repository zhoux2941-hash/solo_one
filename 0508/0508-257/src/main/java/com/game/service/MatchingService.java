package com.game.service;

import com.game.entity.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class MatchingService {

    @Autowired
    private PlayerService playerService;

    @Autowired
    private RoomService roomService;

    @Autowired
    private RoomLogService roomLogService;

    private final Map<Long, Room> matchingRooms = new ConcurrentHashMap<>();

    public void addMatchingRoom(Room room) {
        matchingRooms.put(room.getId(), room);
    }

    public void removeMatchingRoom(Long roomId) {
        matchingRooms.remove(roomId);
    }

    @Scheduled(fixedRate = 5000)
    public void processMatching() {
        if (matchingRooms.isEmpty()) {
            return;
        }

        List<Long> roomIdsToRemove = new ArrayList<>();

        for (Room room : matchingRooms.values()) {
            try {
                int matchedCount = matchPlayersForRoom(room);
                if (matchedCount > 0) {
                    roomLogService.logMatchingSuccess(room, matchedCount);
                }

                if (room.isFull()) {
                    roomIdsToRemove.add(room.getId());
                }
            } catch (Exception e) {
                roomIdsToRemove.add(room.getId());
            }
        }

        for (Long roomId : roomIdsToRemove) {
            matchingRooms.remove(roomId);
        }
    }

    private int matchPlayersForRoom(Room room) {
        int matchedCount = 0;
        List<Player> availablePlayers = playerService.getAvailablePlayers();

        if (availablePlayers.isEmpty()) {
            return 0;
        }

        List<Player> sortedPlayers = sortPlayersByMatchScore(room, availablePlayers);

        for (Player player : sortedPlayers) {
            if (room.isFull()) {
                break;
            }

            if (isRankMatch(player.getRank(), room.getMinRank(), room.getMaxRank())) {
                int team = selectOptimalTeam(room, player.getRank());
                room.addPlayer(player.getId(), team);
                playerService.updatePlayerStatus(player.getId(), true, room.getId());
                roomLogService.logPlayerJoined(room, player.getId(), player.getNickname());
                matchedCount++;
            }
        }

        return matchedCount;
    }

    private List<Player> sortPlayersByMatchScore(Room room, List<Player> players) {
        List<Player> result = new ArrayList<>(players);
        Rank avgRoomRank = calculateAverageRank(room);

        result.sort((p1, p2) -> {
            double score1 = calculateMatchScore(p1.getRank(), avgRoomRank, room);
            double score2 = calculateMatchScore(p2.getRank(), avgRoomRank, room);
            return Double.compare(score2, score1);
        });

        return result;
    }

    private double calculateMatchScore(Rank playerRank, Rank avgRoomRank, Room room) {
        double score = 0.0;

        int rankDiff = Math.abs(playerRank.getLevel() - avgRoomRank.getLevel());
        score += (10 - rankDiff) * 10;

        if (room.getMinRank() != null && playerRank.getLevel() >= room.getMinRank().getLevel()) {
            score += 20;
        }
        if (room.getMaxRank() != null && playerRank.getLevel() <= room.getMaxRank().getLevel()) {
            score += 20;
        }

        score += playerRank.getLevel() * 2;

        return score;
    }

    private int selectOptimalTeam(Room room, Rank playerRank) {
        int team1Size = room.getTeam1Players().size();
        int team2Size = room.getTeam2Players().size();

        if (team1Size == 0 && team2Size == 0) {
            return 1;
        }

        if (Math.abs(team1Size - team2Size) >= 2) {
            return team1Size < team2Size ? 1 : 2;
        }

        Rank team1AvgRank = calculateTeamAverageRank(room, 1);
        Rank team2AvgRank = calculateTeamAverageRank(room, 2);

        int playerLevel = playerRank.getLevel();
        int team1Diff = Math.abs(playerLevel - team1AvgRank.getLevel());
        int team2Diff = Math.abs(playerLevel - team2AvgRank.getLevel());

        if (Math.abs(team1Diff - team2Diff) <= 1) {
            return team1Size <= team2Size ? 1 : 2;
        }

        return team1Diff <= team2Diff ? 1 : 2;
    }

    private Rank calculateTeamAverageRank(Room room, int team) {
        List<Long> playerIds = team == 1 ? room.getTeam1Players() : room.getTeam2Players();

        if (playerIds.isEmpty()) {
            return Rank.SILVER;
        }

        int totalLevel = 0;
        int count = 0;

        for (Long playerId : playerIds) {
            Player player = playerService.getPlayer(playerId);
            if (player != null && player.getRank() != null) {
                totalLevel += player.getRank().getLevel();
                count++;
            }
        }

        if (count == 0) {
            return Rank.SILVER;
        }

        int avgLevel = Math.round((float) totalLevel / count);
        return getRankByLevel(avgLevel);
    }

    private Rank calculateAverageRank(Room room) {
        List<Long> allPlayers = new ArrayList<>();
        allPlayers.addAll(room.getTeam1Players());
        allPlayers.addAll(room.getTeam2Players());

        if (allPlayers.isEmpty()) {
            return Rank.SILVER;
        }

        int totalLevel = 0;
        int count = 0;

        for (Long playerId : allPlayers) {
            Player player = playerService.getPlayer(playerId);
            if (player != null && player.getRank() != null) {
                totalLevel += player.getRank().getLevel();
                count++;
            }
        }

        if (count == 0) {
            return Rank.SILVER;
        }

        int avgLevel = Math.round((float) totalLevel / count);
        return getRankByLevel(avgLevel);
    }

    private Rank getRankByLevel(int level) {
        Rank[] ranks = Rank.values();
        for (Rank rank : ranks) {
            if (rank.getLevel() == level) {
                return rank;
            }
        }
        if (level <= Rank.BRONZE.getLevel()) {
            return Rank.BRONZE;
        }
        return Rank.CHALLENGER;
    }

    private boolean isRankMatch(Rank playerRank, Rank minRank, Rank maxRank) {
        if (minRank == null && maxRank == null) {
            return true;
        }

        int playerLevel = playerRank.getLevel();
        int minLevel = minRank != null ? minRank.getLevel() : Rank.BRONZE.getLevel();
        int maxLevel = maxRank != null ? maxRank.getLevel() : Rank.CHALLENGER.getLevel();

        return playerLevel >= minLevel && playerLevel <= maxLevel;
    }

    public List<Player> findMatchingPlayers(Rank targetRank, int maxCount) {
        List<Player> result = new ArrayList<>();
        List<Player> availablePlayers = playerService.getAvailablePlayers();

        availablePlayers.sort((p1, p2) -> {
            int diff1 = Math.abs(p1.getRank().getLevel() - targetRank.getLevel());
            int diff2 = Math.abs(p2.getRank().getLevel() - targetRank.getLevel());
            return Integer.compare(diff1, diff2);
        });

        for (Player player : availablePlayers) {
            if (result.size() >= maxCount) {
                break;
            }
            if (player.getRank().isCloseRank(targetRank)) {
                result.add(player);
            }
        }

        return result;
    }

    public Map<String, Object> getRoomBalanceInfo(Room room) {
        Map<String, Object> info = new HashMap<>();

        Rank team1AvgRank = calculateTeamAverageRank(room, 1);
        Rank team2AvgRank = calculateTeamAverageRank(room, 2);
        Rank overallAvgRank = calculateAverageRank(room);

        info.put("team1AverageRank", team1AvgRank);
        info.put("team2AverageRank", team2AvgRank);
        info.put("overallAverageRank", overallAvgRank);
        info.put("team1Size", room.getTeam1Players().size());
        info.put("team2Size", room.getTeam2Players().size());
        info.put("balanceScore", calculateBalanceScore(room));

        return info;
    }

    private double calculateBalanceScore(Room room) {
        Rank team1AvgRank = calculateTeamAverageRank(room, 1);
        Rank team2AvgRank = calculateTeamAverageRank(room, 2);

        int rankDiff = Math.abs(team1AvgRank.getLevel() - team2AvgRank.getLevel());
        int sizeDiff = Math.abs(room.getTeam1Players().size() - room.getTeam2Players().size());

        double rankScore = Math.max(0, 100 - rankDiff * 15);
        double sizeScore = Math.max(0, 100 - sizeDiff * 25);

        return (rankScore + sizeScore) / 2;
    }

    public boolean isRoomBalanced(Room room) {
        if (!room.isFull()) {
            return false;
        }

        double balanceScore = calculateBalanceScore(room);
        return balanceScore >= 60;
    }

    public List<Room> getMatchingRoomsList() {
        return new ArrayList<>(matchingRooms.values());
    }

    public int getMatchingRoomsCount() {
        return matchingRooms.size();
    }
}