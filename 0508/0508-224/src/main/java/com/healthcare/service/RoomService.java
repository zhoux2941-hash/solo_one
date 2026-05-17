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
public class RoomService {
    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BedRepository bedRepository;

    public Room save(Room room) {
        if (room.getId() == null) {
            if (roomRepository.existsByRoomNo(room.getRoomNo())) {
                throw new RuntimeException("房间编号已存在");
            }
        } else {
            if (roomRepository.existsByRoomNoAndIdNot(room.getRoomNo(), room.getId())) {
                throw new RuntimeException("房间编号已存在");
            }
            Room oldRoom = findById(room.getId());
            if (oldRoom != null && oldRoom.getStatus() == 1 && room.getStatus() == 0) {
                List<Bed> beds = bedRepository.findByRoomId(room.getId());
                for (Bed bed : beds) {
                    bed.setStatus(0);
                    bed.setBedStatus("维修中");
                    bedRepository.save(bed);
                }
            }
        }
        return roomRepository.save(room);
    }

    public void delete(Long id) {
        roomRepository.deleteById(id);
    }

    public Room findById(Long id) {
        Optional<Room> opt = roomRepository.findById(id);
        return opt.orElse(null);
    }

    public List<Room> findAll() {
        return roomRepository.findAll();
    }

    public Page<Room> findPage(int page, int size, String name, String roomType, String floorNo, Integer status, Long orgId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Specification<Room> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(name)) {
                predicates.add(cb.like(root.get("name"), "%" + name + "%"));
            }
            if (StringUtils.hasText(roomType)) {
                predicates.add(cb.equal(root.get("roomType"), roomType));
            }
            if (StringUtils.hasText(floorNo)) {
                predicates.add(cb.equal(root.get("floorNo"), floorNo));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (orgId != null) {
                predicates.add(cb.equal(root.get("orgId"), orgId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return roomRepository.findAll(spec, pageable);
    }
}