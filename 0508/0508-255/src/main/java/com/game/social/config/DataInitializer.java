package com.game.social.config;

import com.game.social.entity.*;
import com.game.social.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(PlayerRepository playerRepository,
                                       FriendRepository friendRepository,
                                       BlacklistRepository blacklistRepository,
                                       TeamRepository teamRepository,
                                       TeamMemberRepository teamMemberRepository,
                                       TeamActivityRepository teamActivityRepository,
                                       TeamWelfareRepository teamWelfareRepository) {
        return args -> {
            Player p1 = new Player();
            p1.setUsername("player1");
            p1.setNickname("战神");
            p1.setLevel(50);
            p1.setAvatar("avatar1.png");
            p1.setCreateTime(LocalDateTime.now());
            playerRepository.save(p1);

            Player p2 = new Player();
            p2.setUsername("player2");
            p2.setNickname("暗影");
            p2.setLevel(45);
            p2.setAvatar("avatar2.png");
            p2.setCreateTime(LocalDateTime.now());
            playerRepository.save(p2);

            Player p3 = new Player();
            p3.setUsername("player3");
            p3.setNickname("风暴");
            p3.setLevel(55);
            p3.setAvatar("avatar3.png");
            p3.setCreateTime(LocalDateTime.now());
            playerRepository.save(p3);

            Player p4 = new Player();
            p4.setUsername("player4");
            p4.setNickname("烈焰");
            p4.setLevel(48);
            p4.setAvatar("avatar4.png");
            p4.setCreateTime(LocalDateTime.now());
            playerRepository.save(p4);

            Friend f1 = new Friend();
            f1.setPlayerId(p1.getId());
            f1.setFriendId(p2.getId());
            f1.setFriendNickname(p2.getNickname());
            f1.setCreateTime(LocalDateTime.now());
            friendRepository.save(f1);

            Friend f2 = new Friend();
            f2.setPlayerId(p2.getId());
            f2.setFriendId(p1.getId());
            f2.setFriendNickname(p1.getNickname());
            f2.setCreateTime(LocalDateTime.now());
            friendRepository.save(f2);

            Blacklist b1 = new Blacklist();
            b1.setPlayerId(p1.getId());
            b1.setBlockedPlayerId(p4.getId());
            b1.setBlockedNickname(p4.getNickname());
            b1.setReason("恶意骚扰");
            b1.setCreateTime(LocalDateTime.now());
            blacklistRepository.save(b1);

            Team t1 = new Team();
            t1.setName("天龙战队");
            t1.setDescription("最强战队，欢迎加入！");
            t1.setLeaderId(p1.getId());
            t1.setLeaderName(p1.getNickname());
            t1.setMaxMembers(10);
            t1.setCurrentMembers(3);
            t1.setStatus("APPROVED");
            t1.setCreateTime(LocalDateTime.now());
            teamRepository.save(t1);

            TeamMember tm1 = new TeamMember();
            tm1.setTeamId(t1.getId());
            tm1.setPlayerId(p1.getId());
            tm1.setPlayerName(p1.getNickname());
            tm1.setRole("CAPTAIN");
            tm1.setJoinTime(LocalDateTime.now());
            teamMemberRepository.save(tm1);

            TeamMember tm2 = new TeamMember();
            tm2.setTeamId(t1.getId());
            tm2.setPlayerId(p2.getId());
            tm2.setPlayerName(p2.getNickname());
            tm2.setRole("MANAGER");
            tm2.setJoinTime(LocalDateTime.now());
            teamMemberRepository.save(tm2);

            TeamMember tm3 = new TeamMember();
            tm3.setTeamId(t1.getId());
            tm3.setPlayerId(p3.getId());
            tm3.setPlayerName(p3.getNickname());
            tm3.setRole("MEMBER");
            tm3.setJoinTime(LocalDateTime.now());
            teamMemberRepository.save(tm3);

            TeamActivity ta1 = new TeamActivity();
            ta1.setTeamId(t1.getId());
            ta1.setActivityDate(LocalDate.now());
            ta1.setActiveMembers(3);
            ta1.setTotalActivity(150);
            teamActivityRepository.save(ta1);

            TeamWelfare tw1 = new TeamWelfare();
            tw1.setTeamId(t1.getId());
            tw1.setWelfareName("每日签到奖励");
            tw1.setWelfareType("DAILY_CHECKIN");
            tw1.setDescription("每日签到可获得100金币");
            tw1.setReward("100金币");
            tw1.setEnabled(true);
            tw1.setCreateTime(LocalDateTime.now());
            teamWelfareRepository.save(tw1);

            TeamWelfare tw2 = new TeamWelfare();
            tw2.setTeamId(t1.getId());
            tw2.setWelfareName("团队任务奖励");
            tw2.setWelfareType("TEAM_TASK");
            tw2.setDescription("完成团队任务可获得稀有装备");
            tw2.setReward("稀有装备 x1");
            tw2.setEnabled(true);
            tw2.setCreateTime(LocalDateTime.now());
            teamWelfareRepository.save(tw2);
        };
    }
}
