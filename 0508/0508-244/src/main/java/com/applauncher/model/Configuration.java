package com.applauncher.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class Configuration implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private List<AppGroup> groups;
    private String lastSavePath;
    private long lastModified;

    public Configuration() {
        this.groups = new ArrayList<>();
        this.lastModified = System.currentTimeMillis();
    }

    public List<AppGroup> getGroups() {
        return groups;
    }

    public void setGroups(List<AppGroup> groups) {
        this.groups = groups;
        sortGroups();
    }

    public void addGroup(AppGroup group) {
        if (!groups.contains(group)) {
            groups.add(group);
            sortGroups();
        }
    }

    public void removeGroup(AppGroup group) {
        groups.remove(group);
    }

    public void moveGroup(int fromIndex, int toIndex) {
        if (fromIndex >= 0 && fromIndex < groups.size() && 
            toIndex >= 0 && toIndex < groups.size()) {
            AppGroup group = groups.remove(fromIndex);
            groups.add(toIndex, group);
            updateGroupOrders();
        }
    }

    private void updateGroupOrders() {
        for (int i = 0; i < groups.size(); i++) {
            groups.get(i).setDisplayOrder(i);
        }
    }

    private void sortGroups() {
        groups.sort(Comparator.comparingInt(AppGroup::getDisplayOrder));
    }

    public AppGroup getGroupByName(String name) {
        for (AppGroup group : groups) {
            if (group.getName().equals(name)) {
                return group;
            }
        }
        return null;
    }

    public void initializeDefaultGroups() {
        if (groups.isEmpty()) {
            AppGroup workGroup = new AppGroup("工作");
            workGroup.setDescription("办公软件、开发工具等");
            workGroup.setDisplayOrder(0);
            
            AppGroup entertainmentGroup = new AppGroup("娱乐");
            entertainmentGroup.setDescription("游戏、视频、音乐等");
            entertainmentGroup.setDisplayOrder(1);
            
            AppGroup studyGroup = new AppGroup("学习");
            studyGroup.setDescription("学习资料、教程等");
            studyGroup.setDisplayOrder(2);
            
            groups.add(workGroup);
            groups.add(entertainmentGroup);
            groups.add(studyGroup);
        }
    }

    public String getLastSavePath() {
        return lastSavePath;
    }

    public void setLastSavePath(String lastSavePath) {
        this.lastSavePath = lastSavePath;
    }

    public long getLastModified() {
        return lastModified;
    }

    public void setLastModified(long lastModified) {
        this.lastModified = lastModified;
    }

    public void updateModified() {
        this.lastModified = System.currentTimeMillis();
    }
}
