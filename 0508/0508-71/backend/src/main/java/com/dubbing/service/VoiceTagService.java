package com.dubbing.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dubbing.entity.TaskTag;
import com.dubbing.entity.User;
import com.dubbing.entity.UserTag;
import com.dubbing.entity.VoiceTag;
import com.dubbing.mapper.TaskTagMapper;
import com.dubbing.mapper.UserTagMapper;
import com.dubbing.mapper.VoiceTagMapper;
import com.dubbing.util.UserContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class VoiceTagService {

    @Autowired
    private VoiceTagMapper voiceTagMapper;

    @Autowired
    private UserTagMapper userTagMapper;

    @Autowired
    private TaskTagMapper taskTagMapper;

    public List<VoiceTag> getAllTags() {
        return voiceTagMapper.selectList(new LambdaQueryWrapper<VoiceTag>()
                .orderByAsc(VoiceTag::getSortOrder)
                .orderByAsc(VoiceTag::getId));
    }

    public List<VoiceTag> getUserTags(Long userId) {
        List<UserTag> userTags = userTagMapper.selectList(new LambdaQueryWrapper<UserTag>()
                .eq(UserTag::getUserId, userId));
        
        if (userTags.isEmpty()) {
            return Collections.emptyList();
        }
        
        List<Long> tagIds = userTags.stream()
                .map(UserTag::getTagId)
                .collect(Collectors.toList());
        
        return voiceTagMapper.selectList(new LambdaQueryWrapper<VoiceTag>()
                .in(VoiceTag::getId, tagIds));
    }

    public List<VoiceTag> getTaskTags(Long taskId) {
        List<TaskTag> taskTags = taskTagMapper.selectList(new LambdaQueryWrapper<TaskTag>()
                .eq(TaskTag::getTaskId, taskId));
        
        if (taskTags.isEmpty()) {
            return Collections.emptyList();
        }
        
        List<Long> tagIds = taskTags.stream()
                .map(TaskTag::getTagId)
                .collect(Collectors.toList());
        
        return voiceTagMapper.selectList(new LambdaQueryWrapper<VoiceTag>()
                .in(VoiceTag::getId, tagIds));
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateUserTags(List<Long> tagIds) {
        User currentUser = UserContext.getCurrentUser();
        if (currentUser.getRole() != 2) {
            throw new RuntimeException("只有配音员可以设置标签");
        }

        userTagMapper.delete(new LambdaQueryWrapper<UserTag>()
                .eq(UserTag::getUserId, currentUser.getId()));

        if (tagIds != null && !tagIds.isEmpty()) {
            for (Long tagId : tagIds) {
                UserTag userTag = new UserTag();
                userTag.setUserId(currentUser.getId());
                userTag.setTagId(tagId);
                userTagMapper.insert(userTag);
            }
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void saveTaskTags(Long taskId, List<Long> tagIds) {
        taskTagMapper.delete(new LambdaQueryWrapper<TaskTag>()
                .eq(TaskTag::getTaskId, taskId));

        if (tagIds != null && !tagIds.isEmpty()) {
            List<TaskTag> taskTags = new ArrayList<>();
            for (Long tagId : tagIds) {
                TaskTag taskTag = new TaskTag();
                taskTag.setTaskId(taskId);
                taskTag.setTagId(tagId);
                taskTags.add(taskTag);
            }
            for (TaskTag taskTag : taskTags) {
                taskTagMapper.insert(taskTag);
            }
        }
    }

    public List<Long> getTaskTagIds(Long taskId) {
        List<TaskTag> taskTags = taskTagMapper.selectList(new LambdaQueryWrapper<TaskTag>()
                .eq(TaskTag::getTaskId, taskId));
        return taskTags.stream()
                .map(TaskTag::getTagId)
                .collect(Collectors.toList());
    }

    public List<Long> getTasksByTagIds(List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<TaskTag> taskTags = taskTagMapper.selectList(new LambdaQueryWrapper<TaskTag>()
                .in(TaskTag::getTagId, tagIds));
        return taskTags.stream()
                .map(TaskTag::getTaskId)
                .distinct()
                .collect(Collectors.toList());
    }
}
