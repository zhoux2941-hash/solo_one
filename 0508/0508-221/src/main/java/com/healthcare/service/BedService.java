package com.healthcare.service;

import com.healthcare.entity.Bed;
import com.healthcare.entity.Room;
import com.healthcare.repository.BedRepository;
import com.healthcare.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class BedService {
    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private RoomRepository roomRepository;

    public Bed save(Bed bed) {
        Optional<Room> roomOpt = roomRepository.findById(bed.getRoomId());
        if (!roomOpt.isPresent()) {
            throw new RuntimeException("所属房间不存在");
        }
        Room room = roomOpt.get();
        if (room.getStatus() == 0) {
            throw new RuntimeException("所属房间已禁用，无法操作该床位");
        }

        if (bed.getId() == null) {
            if (bedRepository.existsByBedNo(bed.getBedNo())) {
                throw new RuntimeException("床位编号已存在");
            }
        } else {
            if (bedRepository.existsByBedNoAndIdNot(bed.getBedNo(), bed.getId())) {
                throw new RuntimeException("床位编号已存在");
            }
        }
        return bedRepository.save(bed);
    }

    public void delete(Long id) {
        Optional<Bed> bedOpt = bedRepository.findById(id);
        if (bedOpt.isPresent()) {
            Bed bed = bedOpt.get();
            Optional<Room> roomOpt = roomRepository.findById(bed.getRoomId());
            if (roomOpt.isPresent() && roomOpt.get().getStatus() == 0) {
                throw new RuntimeException("所属房间已禁用，无法操作该床位");
            }
        }
        bedRepository.deleteById(id);
    }

    public Bed findById(Long id) {
        Optional<Bed> opt = bedRepository.findById(id);
        return opt.orElse(null);
    }

    public List<Bed> findByRoomId(Long roomId) {
        return bedRepository.findByRoomId(roomId);
    }

    public Page<Bed> findPage(int page, int size, String bedNo, String bedType, String bedStatus, Long roomId, Long orgId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Specification<Bed> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(bedNo)) {
                predicates.add(cb.like(root.get("bedNo"), "%" + bedNo + "%"));
            }
            if (StringUtils.hasText(bedType)) {
                predicates.add(cb.equal(root.get("bedType"), bedType));
            }
            if (StringUtils.hasText(bedStatus)) {
                predicates.add(cb.equal(root.get("bedStatus"), bedStatus));
            }
            if (roomId != null) {
                predicates.add(cb.equal(root.get("roomId"), roomId));
            }
            if (orgId != null) {
                predicates.add(cb.equal(root.get("orgId"), orgId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return bedRepository.findAll(spec, pageable);
    }
}