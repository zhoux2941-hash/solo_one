package com.example.lostfound.dto;

import com.example.lostfound.entity.FoundItem;
import com.example.lostfound.entity.LostItem;
import com.example.lostfound.entity.MatchRecord;
import lombok.Data;

@Data
public class MatchDetailVO {
    private MatchRecord record;
    private LostItem lostItem;
    private FoundItem foundItem;
}
