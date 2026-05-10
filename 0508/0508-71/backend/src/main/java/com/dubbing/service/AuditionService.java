package com.dubbing.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dubbing.common.PageResult;
import com.dubbing.entity.Audition;
import com.dubbing.entity.Task;
import com.dubbing.entity.User;
import com.dubbing.mapper.AuditionMapper;
import com.dubbing.mapper.TaskMapper;
import com.dubbing.mapper.UserMapper;
import com.dubbing.util.UserContext;
import com.dubbing.vo.AuditionVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AuditionService {

    @Autowired
    private AuditionMapper auditionMapper;

    @Autowired
    private TaskMapper taskMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Value("${app.audio.upload-path}")
    private String uploadPath;

    @Value("${app.audio.max-size}")
    private Long maxSize;

    private static final String HOT_TASKS_KEY = "hot:tasks";

    @Transactional(rollbackFor = Exception.class)
    public AuditionVO submitAudition(Long taskId, String remark, MultipartFile audioFile) throws IOException {
        User currentUser = UserContext.getCurrentUser();
        if (currentUser.getRole() != 2) {
            throw new RuntimeException("只有配音员可以提交试音");
        }

        Task task = taskMapper.selectById(taskId);
        if (task == null) {
            throw new RuntimeException("任务不存在");
        }
        if (task.getStatus() != 1) {
            throw new RuntimeException("任务已结束，无法提交试音");
        }

        Long existCount = auditionMapper.selectCount(new LambdaQueryWrapper<Audition>()
                .eq(Audition::getTaskId, taskId)
                .eq(Audition::getVoiceActorId, currentUser.getId()));
        if (existCount > 0) {
            throw new RuntimeException("您已提交过试音，无法重复提交");
        }

        if (audioFile == null || audioFile.isEmpty()) {
            throw new RuntimeException("请上传试音音频");
        }
        if (audioFile.getSize() > maxSize) {
            throw new RuntimeException("音频文件不能超过5MB");
        }

        String originalFilename = audioFile.getOriginalFilename();
        String extension = StringUtils.getFilenameExtension(originalFilename);
        if (extension == null || !extension.equalsIgnoreCase("mp3")) {
            throw new RuntimeException("只能上传mp3格式的音频文件");
        }

        String fileName = IdUtil.simpleUUID() + "." + extension;
        File uploadDir = new File(uploadPath);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }
        File destFile = new File(uploadDir, fileName);
        audioFile.transferTo(destFile);

        Audition audition = new Audition();
        audition.setTaskId(taskId);
        audition.setVoiceActorId(currentUser.getId());
        audition.setAudioPath(fileName);
        audition.setRemark(remark);
        audition.setStatus(0);
        auditionMapper.insert(audition);

        task.setAuditionCount(task.getAuditionCount() + 1);
        taskMapper.updateById(task);

        redisTemplate.delete(HOT_TASKS_KEY);

        return convertToVO(audition);
    }

    public List<AuditionVO> getTaskAuditions(Long taskId) {
        User currentUser = UserContext.getCurrentUser();
        Task task = taskMapper.selectById(taskId);
        
        if (task == null) {
            throw new RuntimeException("任务不存在");
        }

        if (currentUser.getRole() == 1 && !task.getPublisherId().equals(currentUser.getId())) {
            throw new RuntimeException("无权限查看此任务的试音");
        }

        List<Audition> auditions = auditionMapper.selectList(new LambdaQueryWrapper<Audition>()
                .eq(Audition::getTaskId, taskId)
                .orderByDesc(Audition::getCreateTime));

        return auditions.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    public List<AuditionVO> getMyAuditions() {
        User currentUser = UserContext.getCurrentUser();
        List<Audition> auditions = auditionMapper.selectList(new LambdaQueryWrapper<Audition>()
                .eq(Audition::getVoiceActorId, currentUser.getId())
                .orderByDesc(Audition::getCreateTime));

        return auditions.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    private AuditionVO convertToVO(Audition audition) {
        AuditionVO vo = new AuditionVO();
        BeanUtils.copyProperties(audition, vo);
        
        User voiceActor = userMapper.selectById(audition.getVoiceActorId());
        if (voiceActor != null) {
            vo.setVoiceActorName(voiceActor.getNickname());
        }
        
        Task task = taskMapper.selectById(audition.getTaskId());
        if (task != null) {
            vo.setTaskTitle(task.getTitle());
        }
        
        return vo;
    }
}
