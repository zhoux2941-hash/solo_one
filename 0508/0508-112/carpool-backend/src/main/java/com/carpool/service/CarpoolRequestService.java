package com.carpool.service;

import com.carpool.dto.RequestDTO;
import com.carpool.entity.CarpoolRequest;
import com.carpool.entity.CarpoolGroup;
import com.carpool.entity.Trip;
import com.carpool.entity.User;
import com.carpool.repository.CarpoolGroupRepository;
import com.carpool.repository.CarpoolRequestRepository;
import com.carpool.repository.TripRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CarpoolRequestService {

    private final CarpoolRequestRepository requestRepository;
    private final TripRepository tripRepository;
    private final CarpoolGroupRepository groupRepository;
    private final UserService userService;
    private final TripService tripService;

    public CarpoolRequestService(CarpoolRequestRepository requestRepository,
                                  TripRepository tripRepository,
                                  CarpoolGroupRepository groupRepository,
                                  UserService userService,
                                  TripService tripService) {
        this.requestRepository = requestRepository;
        this.tripRepository = tripRepository;
        this.groupRepository = groupRepository;
        this.userService = userService;
        this.tripService = tripService;
    }

    @Transactional
    public RequestDTO.RequestResponse createRequest(Long requesterId, Long tripId, RequestDTO.CreateRequest request) {
        Trip trip = tripRepository.findById(tripId)
            .orElseThrow(() -> new RuntimeException("行程不存在"));

        if (trip.getPublisher().getId().equals(requesterId)) {
            throw new RuntimeException("不能申请自己发布的行程");
        }

        if (!"OPEN".equals(trip.getStatus())) {
            throw new RuntimeException("该行程已关闭或已满员");
        }

        if (trip.getAvailableSeats() < request.getSeatsRequested()) {
            throw new RuntimeException("座位不足");
        }

        if (requestRepository.existsByTripIdAndRequesterId(tripId, requesterId)) {
            throw new RuntimeException("您已申请过该行程，请等待车主回复");
        }

        User requester = userService.getUserById(requesterId);

        CarpoolRequest carpoolRequest = new CarpoolRequest();
        carpoolRequest.setTrip(trip);
        carpoolRequest.setRequester(requester);
        carpoolRequest.setSeatsRequested(request.getSeatsRequested());
        carpoolRequest.setMessage(request.getMessage());
        carpoolRequest.setStatus("PENDING");

        CarpoolRequest saved;
        try {
            saved = requestRepository.save(carpoolRequest);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("您已申请过该行程，请等待车主回复");
        }
        return convertToResponse(saved);
    }

    public List<RequestDTO.RequestResponse> getMyRequests(Long userId) {
        return requestRepository.findByRequesterIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    public List<RequestDTO.RequestResponse> getRequestsForMyTrips(Long publisherId) {
        return requestRepository.findByTripPublisherAndStatus(publisherId, "PENDING")
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public RequestDTO.RequestResponse respondToRequest(Long publisherId, Long requestId, String action) {
        CarpoolRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("申请不存在"));

        if (!request.getTrip().getPublisher().getId().equals(publisherId)) {
            throw new RuntimeException("没有权限操作");
        }

        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("申请已被处理");
        }

        if ("ACCEPT".equalsIgnoreCase(action)) {
            handleAccept(request);
        } else if ("REJECT".equalsIgnoreCase(action)) {
            request.setStatus("REJECTED");
        } else {
            throw new RuntimeException("无效的操作");
        }

        request.setRespondedAt(LocalDateTime.now());
        CarpoolRequest saved = requestRepository.save(request);
        return convertToResponse(saved);
    }

    private void handleAccept(CarpoolRequest request) {
        Trip trip = request.getTrip();
        int seats = request.getSeatsRequested();

        if (trip.getAvailableSeats() < seats) {
            throw new RuntimeException("座位不足");
        }

        request.setStatus("ACCEPTED");

        tripService.decreaseAvailableSeats(trip.getId(), seats);

        CarpoolGroup group = groupRepository.findByTripId(trip.getId())
            .orElseGet(() -> {
                CarpoolGroup newGroup = new CarpoolGroup();
                newGroup.setTrip(trip);
                newGroup.setLeader(trip.getPublisher());
                newGroup.getMembers().add(trip.getPublisher());
                return groupRepository.save(newGroup);
            });

        if (!group.getMembers().contains(request.getRequester())) {
            group.getMembers().add(request.getRequester());
            groupRepository.save(group);
        }
    }

    private RequestDTO.RequestResponse convertToResponse(CarpoolRequest request) {
        RequestDTO.RequestResponse response = new RequestDTO.RequestResponse();
        response.setId(request.getId());
        response.setTripId(request.getTrip().getId());
        response.setDepartureCity(request.getTrip().getDepartureCity());
        response.setDestinationCity(request.getTrip().getDestinationCity());
        response.setDepartureTime(request.getTrip().getDepartureTime());
        response.setRequesterId(request.getRequester().getId());
        response.setRequesterName(request.getRequester().getRealName());
        response.setRequesterCreditScore(request.getRequester().getCreditScore());
        response.setSeatsRequested(request.getSeatsRequested());
        response.setMessage(request.getMessage());
        response.setStatus(request.getStatus());
        response.setCreatedAt(request.getCreatedAt());
        response.setRespondedAt(request.getRespondedAt());
        return response;
    }
}
