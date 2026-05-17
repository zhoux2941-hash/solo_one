package com.game.social.service;

import com.game.social.entity.Friend;
import com.game.social.entity.Player;
import com.game.social.repository.FriendRepository;
import com.game.social.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class FriendService {

    @Autowired
    private FriendRepository friendRepository;

    @Autowired
    private PlayerRepository playerRepository;

    public List<Friend> getFriendsByPlayerId(Long playerId) {
        return friendRepository.findByPlayerId(playerId);
    }

    public Friend addFriend(Long playerId, Long friendId) {
        Optional<Friend> existingFriend = friendRepository.findByPlayerIdAndFriendId(playerId, friendId);
        if (existingFriend.isPresent()) {
            throw new RuntimeException("Already friends");
        }

        Player friendPlayer = playerRepository.findById(friendId)
                .orElseThrow(() -> new RuntimeException("Friend player not found"));

        Friend friend = new Friend();
        friend.setPlayerId(playerId);
        friend.setFriendId(friendId);
        friend.setFriendNickname(friendPlayer.getNickname());
        friend.setFriendAvatar(friendPlayer.getAvatar());
        friend.setCreateTime(LocalDateTime.now());

        Friend reverseFriend = new Friend();
        reverseFriend.setPlayerId(friendId);
        reverseFriend.setFriendId(playerId);
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        reverseFriend.setFriendNickname(player.getNickname());
        reverseFriend.setFriendAvatar(player.getAvatar());
        reverseFriend.setCreateTime(LocalDateTime.now());

        friendRepository.save(reverseFriend);
        return friendRepository.save(friend);
    }

    @Transactional
    public void removeFriend(Long playerId, Long friendId) {
        friendRepository.deleteByPlayerIdAndFriendId(playerId, friendId);
        friendRepository.deleteByPlayerIdAndFriendId(friendId, playerId);
    }

    public Page<Friend> getFriendsWithPagination(Long playerId, Pageable pageable) {
        return friendRepository.findByPlayerId(playerId, pageable);
    }
}
