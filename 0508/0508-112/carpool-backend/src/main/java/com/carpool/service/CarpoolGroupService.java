package com.carpool.service;

import com.carpool.dto.MessageDTO;
import com.carpool.entity.CarpoolGroup;
import com.carpool.entity.Message;
import com.carpool.entity.User;
import com.carpool.repository.CarpoolGroupRepository;
import com.carpool.repository.MessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CarpoolGroupService {

    private final CarpoolGroupRepository groupRepository;
    private final MessageRepository messageRepository;
    private final UserService userService;

    public CarpoolGroupService(CarpoolGroupRepository groupRepository,
                               MessageRepository messageRepository,
                               UserService userService) {
        this.groupRepository = groupRepository;
        this.messageRepository = messageRepository;
        this.userService = userService;
    }

    public List<MessageDTO.GroupResponse> getMyGroups(Long userId) {
        return groupRepository.findByUserId(userId)
            .stream()
            .map(this::convertToGroupResponse)
            .collect(Collectors.toList());
    }

    public MessageDTO.GroupResponse getGroupById(Long userId, Long groupId) {
        CarpoolGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("小组不存在"));

        if (!isGroupMember(userId, group)) {
            throw new RuntimeException("没有权限访问该小组");
        }

        return convertToGroupResponse(group);
    }

    @Transactional
    public MessageDTO.MessageResponse sendMessage(Long userId, Long groupId, MessageDTO.SendMessage request) {
        CarpoolGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("小组不存在"));

        if (!isGroupMember(userId, group)) {
            throw new RuntimeException("没有权限在该小组发言");
        }

        User sender = userService.getUserById(userId);

        Message message = new Message();
        message.setGroup(group);
        message.setSender(sender);
        message.setContent(request.getContent());

        Message saved = messageRepository.save(message);
        return convertToMessageResponse(saved);
    }

    public List<MessageDTO.MessageResponse> getGroupMessages(Long userId, Long groupId) {
        CarpoolGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("小组不存在"));

        if (!isGroupMember(userId, group)) {
            throw new RuntimeException("没有权限访问该小组");
        }

        return messageRepository.findByGroupIdOrderByCreatedAtAsc(groupId)
            .stream()
            .map(this::convertToMessageResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public void completeTrip(Long userId, Long groupId) {
        CarpoolGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("小组不存在"));

        if (!group.getLeader().getId().equals(userId)) {
            throw new RuntimeException("只有组长可以完成行程");
        }

        group.setStatus("COMPLETED");
        groupRepository.save(group);

        group.getMembers().forEach(member -> {
            userService.increaseCreditScore(member.getId(), 5);
        });
    }

    @Transactional
    public void cancelTrip(Long userId, Long groupId, Long cancelUserId) {
        CarpoolGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("小组不存在"));

        if (!group.getLeader().getId().equals(userId) && !userId.equals(cancelUserId)) {
            throw new RuntimeException("没有权限操作");
        }

        User cancelUser = userService.getUserById(cancelUserId);
        userService.decreaseCreditScore(cancelUserId, 10);

        if (group.getLeader().getId().equals(cancelUserId)) {
            group.setStatus("CANCELED");
            groupRepository.save(group);
        } else {
            group.getMembers().removeIf(m -> m.getId().equals(cancelUserId));
            groupRepository.save(group);
        }
    }

    private boolean isGroupMember(Long userId, CarpoolGroup group) {
        if (group.getLeader().getId().equals(userId)) {
            return true;
        }
        return group.getMembers().stream()
            .anyMatch(m -> m.getId().equals(userId));
    }

    private MessageDTO.GroupResponse convertToGroupResponse(CarpoolGroup group) {
        MessageDTO.GroupResponse response = new MessageDTO.GroupResponse();
        response.setId(group.getId());
        response.setTripId(group.getTrip().getId());
        response.setDepartureCity(group.getTrip().getDepartureCity());
        response.setDestinationCity(group.getTrip().getDestinationCity());
        response.setDepartureTime(group.getTrip().getDepartureTime());
        response.setLeaderId(group.getLeader().getId());
        response.setLeaderName(group.getLeader().getRealName());
        response.setStatus(group.getStatus());
        response.setCreatedAt(group.getCreatedAt());
        response.setMembers(group.getMembers().stream()
            .map(this::convertToMember)
            .collect(Collectors.toList()));
        return response;
    }

    private MessageDTO.GroupMember convertToMember(User user) {
        MessageDTO.GroupMember member = new MessageDTO.GroupMember();
        member.setId(user.getId());
        member.setUsername(user.getUsername());
        member.setRealName(user.getRealName());
        member.setCreditScore(user.getCreditScore());
        return member;
    }

    private MessageDTO.MessageResponse convertToMessageResponse(Message message) {
        MessageDTO.MessageResponse response = new MessageDTO.MessageResponse();
        response.setId(message.getId());
        response.setSenderId(message.getSender().getId());
        response.setSenderName(message.getSender().getRealName());
        response.setContent(message.getContent());
        response.setCreatedAt(message.getCreatedAt());
        return response;
    }
}
