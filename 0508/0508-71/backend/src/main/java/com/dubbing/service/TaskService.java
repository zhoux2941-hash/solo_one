package com.dubbing.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dubbing.common.PageResult;
import com.dubbing.dto.TaskPublishDTO;
import com.dubbing.entity.*;
import com.dubbing.mapper.*;
import com.dubbing.util.UserContext;
import com.dubbing.vo.TaskVO;
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
import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TaskService {

    @Autowired
    private TaskMapper taskMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private AuditionMapper auditionMapper;

    @Autowired
    private MessageMapper messageMapper;

    @Autowired
    private TransactionMapper transactionMapper;

    @Autowired
    private VoiceTagService voiceTagService;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Value("${app.audio.upload-path}")
    private String uploadPath;

    @Value("${app.audio.max-size}")
    private Long maxSize;

    private static final String HOT_TASKS_KEY = "hot:tasks";
    private static final long HOT_TASKS_CACHE_SECONDS = 300;

    @Transactional(rollbackFor = Exception.class)
    public TaskVO publishTask(TaskPublishDTO dto, MultipartFile exampleAudio) throws IOException {
        User currentUser = UserContext.getCurrentUser();
        if (currentUser.getRole() != 1) {
            throw new RuntimeException("只有甲方可以发布任务");
        }

        if (currentUser.getBalance().compareTo(dto.getBudget()) < 0) {
            throw new RuntimeException("余额不足，请先充值");
        }

        Task task = new Task();
        task.setPublisherId(currentUser.getId());
        task.setTitle(dto.getTitle());
        task.setContent(dto.getContent());
        task.setDuration(dto.getDuration());
        task.setBudget(dto.getBudget());
        task.setStatus(1);
        task.setAuditionCount(0);

        if (exampleAudio != null && !exampleAudio.isEmpty()) {
            if (exampleAudio.getSize() > maxSize) {
                throw new RuntimeException("音频文件不能超过5MB");
            }
            String originalFilename = exampleAudio.getOriginalFilename();
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
            exampleAudio.transferTo(destFile);
            task.setExampleAudio(fileName);
        }

        taskMapper.insert(task);
        
        if (dto.getTagIds() != null && !dto.getTagIds().isEmpty()) {
            voiceTagService.saveTaskTags(task.getId(), dto.getTagIds());
        }

        return convertToVO(task);
    }

    public PageResult<TaskVO> listTasks(Long pageNum, Long pageSize, Integer status, String keyword, List<Long> tagIds) {
        Page<Task> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(Task::getStatus, status);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Task::getTitle, keyword);
        }
        
        if (tagIds != null && !tagIds.isEmpty()) {
            List<Long> taskIds = voiceTagService.getTasksByTagIds(tagIds);
            if (taskIds == null || taskIds.isEmpty()) {
                return new PageResult<>(java.util.Collections.emptyList(), 0L, pageNum, pageSize);
            }
            wrapper.in(Task::getId, taskIds);
        }
        
        wrapper.orderByDesc(Task::getCreateTime);
        
        Page<Task> taskPage = taskMapper.selectPage(page, wrapper);
        List<TaskVO> voList = taskPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return new PageResult<>(voList, taskPage.getTotal(), taskPage.getCurrent(), taskPage.getSize());
    }

    public List<TaskVO> getHotTasks() {
        List<TaskVO> cachedHotTasks = (List<TaskVO>) redisTemplate.opsForValue().get(HOT_TASKS_KEY);
        if (cachedHotTasks != null) {
            return cachedHotTasks;
        }

        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Task::getStatus, 1);
        wrapper.orderByDesc(Task::getAuditionCount);
        wrapper.last("LIMIT 10");
        
        List<Task> tasks = taskMapper.selectList(wrapper);
        List<TaskVO> voList = tasks.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        redisTemplate.opsForValue().set(HOT_TASKS_KEY, voList, HOT_TASKS_CACHE_SECONDS, TimeUnit.SECONDS);
        return voList;
    }

    public TaskVO getTaskDetail(Long taskId) {
        Task task = taskMapper.selectById(taskId);
        if (task == null) {
            throw new RuntimeException("任务不存在");
        }
        return convertToVO(task);
    }

    public PageResult<TaskVO> getMyPublishedTasks(Long pageNum, Long pageSize) {
        User currentUser = UserContext.getCurrentUser();
        Page<Task> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Task::getPublisherId, currentUser.getId());
        wrapper.orderByDesc(Task::getCreateTime);
        
        Page<Task> taskPage = taskMapper.selectPage(page, wrapper);
        List<TaskVO> voList = taskPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return new PageResult<>(voList, taskPage.getTotal(), taskPage.getCurrent(), taskPage.getSize());
    }

    @Transactional(rollbackFor = Exception.class)
    public void selectWinner(Long taskId, Long auditionId) {
        User currentUser = UserContext.getCurrentUser();
        Task task = taskMapper.selectById(taskId);
        
        if (task == null) {
            throw new RuntimeException("任务不存在");
        }
        if (!task.getPublisherId().equals(currentUser.getId())) {
            throw new RuntimeException("只能选择自己发布任务的中标者");
        }
        if (task.getStatus() != 1) {
            throw new RuntimeException("任务状态不允许选择中标者");
        }

        Audition winningAudition = auditionMapper.selectById(auditionId);
        if (winningAudition == null || !winningAudition.getTaskId().equals(taskId)) {
            throw new RuntimeException("试音记录不存在");
        }

        task.setStatus(2);
        task.setWinnerId(winningAudition.getVoiceActorId());
        taskMapper.updateById(task);

        auditionMapper.update(null, new LambdaUpdateWrapper<Audition>()
                .eq(Audition::getTaskId, taskId)
                .set(Audition::getStatus, 2));

        winningAudition.setStatus(1);
        auditionMapper.updateById(winningAudition);

        User publisher = userMapper.selectById(currentUser.getId());
        User voiceActor = userMapper.selectById(winningAudition.getVoiceActorId());
        
        BigDecimal budget = task.getBudget();
        publisher.setBalance(publisher.getBalance().subtract(budget));
        voiceActor.setBalance(voiceActor.getBalance().add(budget));
        userMapper.updateById(publisher);
        userMapper.updateById(voiceActor);

        Transaction publisherTrans = new Transaction();
        publisherTrans.setUserId(publisher.getId());
        publisherTrans.setType(2);
        publisherTrans.setAmount(budget);
        publisherTrans.setBalance(publisher.getBalance());
        publisherTrans.setDescription("任务结算扣款：" + task.getTitle());
        publisherTrans.setRelatedTaskId(taskId);
        publisherTrans.setStatus(1);
        transactionMapper.insert(publisherTrans);

        Transaction voiceActorTrans = new Transaction();
        voiceActorTrans.setUserId(voiceActor.getId());
        voiceActorTrans.setType(1);
        voiceActorTrans.setAmount(budget);
        voiceActorTrans.setBalance(voiceActor.getBalance());
        voiceActorTrans.setDescription("任务中标收入：" + task.getTitle());
        voiceActorTrans.setRelatedTaskId(taskId);
        voiceActorTrans.setStatus(1);
        transactionMapper.insert(voiceActorTrans);

        List<Audition> allAuditions = auditionMapper.selectList(new LambdaQueryWrapper<Audition>()
                .eq(Audition::getTaskId, taskId));
        
        for (Audition audition : allAuditions) {
            Message message = new Message();
            message.setUserId(audition.getVoiceActorId());
            message.setRelatedTaskId(taskId);
            message.setIsRead(0);
            
            if (audition.getVoiceActorId().equals(winningAudition.getVoiceActorId())) {
                message.setTitle("恭喜！您的试音已中标");
                message.setContent("您参与的任务【" + task.getTitle() + "】已中标，积分已发放到您的账户！");
                message.setType(1);
            } else {
                message.setTitle("很遗憾，您未中标");
                message.setContent("您参与的任务【" + task.getTitle() + "】已选择中标者，感谢您的参与！");
                message.setType(2);
            }
            messageMapper.insert(message);
        }

        redisTemplate.delete(HOT_TASKS_KEY);
    }

    private TaskVO convertToVO(Task task) {
        TaskVO vo = new TaskVO();
        BeanUtils.copyProperties(task, vo);
        
        User publisher = userMapper.selectById(task.getPublisherId());
        if (publisher != null) {
            vo.setPublisherName(publisher.getNickname());
        }
        
        if (task.getWinnerId() != null) {
            User winner = userMapper.selectById(task.getWinnerId());
            if (winner != null) {
                vo.setWinnerName(winner.getNickname());
            }
        }
        
        List<VoiceTag> tags = voiceTagService.getTaskTags(task.getId());
        vo.setTags(tags);
        
        return vo;
    }
}
