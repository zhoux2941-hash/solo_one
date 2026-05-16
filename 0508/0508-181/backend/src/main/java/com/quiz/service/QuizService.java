package com.quiz.service;

import com.quiz.entity.*;
import com.quiz.websocket.QuizWebSocketHandler;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import javax.annotation.Resource;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class QuizService {

    @Resource
    @Lazy
    private QuizWebSocketHandler webSocketHandler;

    private Question currentQuestion;
    private final Map<String, Team> teams = new ConcurrentHashMap<>();
    private final Map<String, TeamMember> members = new ConcurrentHashMap<>();
    private final Map<String, Answer> answers = new ConcurrentHashMap<>();
    private TeamMember mvp;
    private Long questionStartTime;
    private boolean gameStarted = false;

    public QuizService() {
        teams.put("team1", new Team("team1", "红队"));
        teams.put("team2", new Team("team2", "蓝队"));
    }

    public void handleMessage(WebSocketMessage message, WebSocketSession session) {
        String type = message.getType();
        Map<String, Object> data = (Map<String, Object>) message.getData();

        switch (type) {
            case "HOST_QUESTION":
                handleHostQuestion(data);
                break;
            case "SUBMIT_ANSWER":
                handleSubmitAnswer(data);
                break;
            case "JOIN_TEAM":
                handleJoinTeam(data, session);
                break;
            case "QUESTION_END":
                handleQuestionEnd();
                break;
            case "GAME_END":
                handleGameEnd();
                break;
        }
    }

    private void handleHostQuestion(Map<String, Object> data) {
        String content = (String) data.get("content");
        List<String> options = (List<String>) data.get("options");
        String answer = (String) data.get("answer");
        if (content == null || options == null || answer == null) return;

        Question question = new Question();
        question.setId(UUID.randomUUID().toString());
        question.setContent(content);
        question.setOptions(options);
        question.setAnswer(answer);
        question.setCountdown((Integer) data.getOrDefault("countdown", 20));

        this.currentQuestion = question;
        this.questionStartTime = System.currentTimeMillis();
        this.answers.clear();
        this.gameStarted = true;

        Map<String, Object> questionData = new HashMap<>();
        questionData.put("question", question);
        List<Team> teamList = new ArrayList<>();
        teamList.add(teams.get("team1"));
        teamList.add(teams.get("team2"));
        questionData.put("teams", teamList);

        webSocketHandler.broadcast(new WebSocketMessage("NEW_QUESTION", questionData));
    }

    private void handleSubmitAnswer(Map<String, Object> data) {
        if (currentQuestion == null) return;

        String memberId = (String) data.get("memberId");
        String memberName = (String) data.get("memberName");
        String teamId = (String) data.get("teamId");
        String answerValue = (String) data.get("answer");

        if (memberId == null || answerValue == null) return;

        TeamMember member = members.get(memberId);
        if (member == null) return;

        Answer answer = new Answer();
        answer.setMemberId(memberId);
        answer.setMemberName(memberName);
        answer.setTeamId(teamId);
        answer.setQuestionId(currentQuestion.getId());
        answer.setAnswer(answerValue);
        answer.setResponseTime(System.currentTimeMillis() - questionStartTime);
        answer.setIsCorrect(answerValue.equals(currentQuestion.getAnswer()));

        answers.put(memberId, answer);

        if (answer.getIsCorrect()) {
            member.setCorrectCount(member.getCorrectCount() + 1);
            member.setTotalResponseTime(member.getTotalResponseTime() + answer.getResponseTime());
            updateMvp();
        }

        updateTeamScores();
        broadcastScores();
    }

    private void handleJoinTeam(Map<String, Object> data, WebSocketSession session) {
        String memberName = (String) data.get("memberName");
        String teamId = (String) data.get("teamId");

        if (memberName == null || teamId == null) return;

        String memberId = UUID.randomUUID().toString();
        TeamMember member = new TeamMember(memberId, memberName, teamId);
        members.put(memberId, member);

        Team team = teams.get(teamId);
        if (team != null) {
            team.addMember(member);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("memberId", memberId);
        response.put("member", member);
        List<Team> teamList = new ArrayList<>();
        teamList.add(teams.get("team1"));
        teamList.add(teams.get("team2"));
        response.put("teams", teamList);
        response.put("currentQuestion", currentQuestion);

        webSocketHandler.sendToSession(session, new WebSocketMessage("JOIN_SUCCESS", response));
        broadcastScores();
    }

    private void handleQuestionEnd() {
        updateTeamScores();
        broadcastScores();

        Map<String, Object> endData = new HashMap<>();
        List<Team> teamList = new ArrayList<>();
        teamList.add(teams.get("team1"));
        teamList.add(teams.get("team2"));
        endData.put("teams", teamList);
        endData.put("correctAnswer", currentQuestion != null ? currentQuestion.getAnswer() : "");
        endData.put("answers", new ArrayList<>(answers.values()));

        webSocketHandler.broadcast(new WebSocketMessage("QUESTION_END", endData));
    }

    private void handleGameEnd() {
        updateTeamScores();
        updateMvp();
        Map<String, Object> endData = new HashMap<>();
        List<Team> teamList = new ArrayList<>();
        teamList.add(teams.get("team1"));
        teamList.add(teams.get("team2"));
        endData.put("teams", teamList);
        endData.put("mvp", mvp);

        webSocketHandler.broadcast(new WebSocketMessage("GAME_END", endData));
    }

    private void updateTeamScores() {
        for (Team team : teams.values()) {
            int correctCount = 0;
            for (Answer answer : answers.values()) {
                if (answer.getTeamId() != null && answer.getTeamId().equals(team.getId()) && answer.getIsCorrect()) {
                    correctCount++;
                }
            }
            team.setScore(correctCount * 10);
        }
    }

    private void updateMvp() {
        TeamMember bestMember = null;
        for (TeamMember member : members.values()) {
            if (member.getCorrectCount() == null || member.getTotalResponseTime() == null) {
                continue;
            }
            if (bestMember == null) {
                bestMember = member;
            } else {
                if (member.getCorrectCount() > bestMember.getCorrectCount()) {
                    bestMember = member;
                } else if (member.getCorrectCount().equals(bestMember.getCorrectCount())) {
                    if (member.getTotalResponseTime() < bestMember.getTotalResponseTime()) {
                        bestMember = member;
                    }
                }
            }
        }
        this.mvp = bestMember;
    }

    private void broadcastScores() {
        Map<String, Object> scoreData = new HashMap<>();
        List<Team> teamList = new ArrayList<>();
        teamList.add(teams.get("team1"));
        teamList.add(teams.get("team2"));
        scoreData.put("teams", teamList);
        scoreData.put("answers", new ArrayList<>(answers.values()));
        webSocketHandler.broadcast(new WebSocketMessage("SCORE_UPDATE", scoreData));
    }
}
