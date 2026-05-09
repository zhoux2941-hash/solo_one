package com.loker.cabinet.repository;

import com.loker.cabinet.entity.CabinetCell;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Repository
public class CabinetRepository {
    
    private static final String[] COLUMNS = {"A", "B", "C", "D", "E", "F"};
    private static final int ROWS = 5;
    
    public List<CabinetCell> findAllCells() {
        System.out.println("从数据库加载格口疲劳度数据...");
        
        List<CabinetCell> cells = new ArrayList<>();
        Random random = new Random();
        
        for (int colIdx = 0; colIdx < COLUMNS.length; colIdx++) {
            for (int row = 1; row <= ROWS; row++) {
                String column = COLUMNS[colIdx];
                String cellId = column + row;
                
                int score;
                if (isCorner(colIdx, row)) {
                    score = 70 + random.nextInt(31);
                } else if (isEdge(colIdx, row)) {
                    score = 40 + random.nextInt(31);
                } else {
                    score = 10 + random.nextInt(31);
                }
                
                cells.add(new CabinetCell(column, row, cellId, score));
            }
        }
        
        return cells;
    }
    
    private boolean isCorner(int colIdx, int row) {
        return (colIdx == 0 || colIdx == COLUMNS.length - 1) && (row == 1 || row == ROWS);
    }
    
    private boolean isEdge(int colIdx, int row) {
        return colIdx == 0 || colIdx == COLUMNS.length - 1 || row == 1 || row == ROWS;
    }
}
