package com.voting.service;

import com.voting.dto.PollRequest;
import com.voting.dto.VoteRequest;
import com.voting.entity.Poll;
import com.voting.entity.PollOption;
import com.voting.entity.VoteRecord;
import com.voting.repository.PollRepository;
import com.voting.repository.PollOptionRepository;
import com.voting.repository.VoteRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PollService {

    @Autowired
    private PollRepository pollRepository;

    @Autowired
    private PollOptionRepository pollOptionRepository;

    @Autowired
    private VoteRecordRepository voteRecordRepository;

    @Autowired
    private WebSocketService webSocketService;

    public Poll createPoll(PollRequest request) {
        if (pollRepository.existsByTitle(request.getTitle())) {
            throw new RuntimeException("该投票标题已存在，请使用其他标题");
        }

        if (request.getOptions().size() < 2) {
            throw new RuntimeException("至少需要两个选项");
        }

        if (request.getOptions().size() > 5) {
            throw new RuntimeException("最多只能添加5个选项");
        }

        Poll poll = new Poll();
        poll.setTitle(request.getTitle());
        poll.setAllowMultiple(request.getAllowMultiple());
        poll.setDeadline(request.getDeadline());

        for (String optionText : request.getOptions()) {
            PollOption option = new PollOption();
            option.setOptionText(optionText);
            option.setPoll(poll);
            poll.getOptions().add(option);
        }

        return pollRepository.save(poll);
    }

    public List<Poll> getAllPolls() {
        return pollRepository.findAll();
    }

    public Optional<Poll> getPollById(Long id) {
        return pollRepository.findById(id);
    }

    public boolean checkTitleExists(String title) {
        return pollRepository.existsByTitle(title);
    }

    @Transactional
    public Poll vote(Long pollId, VoteRequest request, String ipAddress) {
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new RuntimeException("投票不存在"));

        if (poll.isExpired()) {
            throw new RuntimeException("投票已截止");
        }

        boolean hasVoted = voteRecordRepository.existsByPollIdAndIpAddressAndNickname(
                pollId, ipAddress, request.getNickname());
        if (hasVoted) {
            throw new RuntimeException("您已投过票了");
        }

        if (!poll.getAllowMultiple() && request.getOptionIds().size() > 1) {
            throw new RuntimeException("该投票不允许多选");
        }

        for (Long optionId : request.getOptionIds()) {
            PollOption option = pollOptionRepository.findById(optionId)
                    .orElseThrow(() -> new RuntimeException("选项不存在"));
            
            if (!option.getPoll().getId().equals(pollId)) {
                throw new RuntimeException("选项不属于该投票");
            }

            option.setVoteCount(option.getVoteCount() + 1);
            pollOptionRepository.save(option);

            VoteRecord record = new VoteRecord();
            record.setPoll(poll);
            record.setOptionId(optionId);
            record.setNickname(request.getNickname());
            record.setIpAddress(ipAddress);
            voteRecordRepository.save(record);
        }

        Poll updatedPoll = pollRepository.findById(pollId).orElse(poll);
        webSocketService.broadcastPollUpdate(updatedPoll);

        return updatedPoll;
    }
}
