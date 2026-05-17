package com.applauncher.model;

import java.io.Serializable;
import java.util.Objects;

public class Application implements Serializable, Comparable<Application> {
    private static final long serialVersionUID = 1L;
    
    private String id;
    private String name;
    private String path;
    private String iconPath;
    private String description;
    private int priority;
    private boolean isPinned;
    private int launchCount;
    private long lastLaunchTime;

    public Application() {
        this.id = java.util.UUID.randomUUID().toString();
        this.priority = 0;
        this.isPinned = false;
        this.launchCount = 0;
        this.lastLaunchTime = 0;
    }

    public Application(String name, String path) {
        this();
        this.name = name;
        this.path = path;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getIconPath() {
        return iconPath;
    }

    public void setIconPath(String iconPath) {
        this.iconPath = iconPath;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getPriority() {
        return priority;
    }

    public void setPriority(int priority) {
        this.priority = priority;
    }

    public boolean isPinned() {
        return isPinned;
    }

    public void setPinned(boolean pinned) {
        isPinned = pinned;
    }

    public int getLaunchCount() {
        return launchCount;
    }

    public void setLaunchCount(int launchCount) {
        this.launchCount = launchCount;
    }

    public void incrementLaunchCount() {
        this.launchCount++;
        this.lastLaunchTime = System.currentTimeMillis();
    }

    public long getLastLaunchTime() {
        return lastLaunchTime;
    }

    public void setLastLaunchTime(long lastLaunchTime) {
        this.lastLaunchTime = lastLaunchTime;
    }

    @Override
    public int compareTo(Application other) {
        if (this.isPinned && !other.isPinned) {
            return -1;
        }
        if (!this.isPinned && other.isPinned) {
            return 1;
        }
        return Integer.compare(this.priority, other.priority);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Application that = (Application) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return name;
    }
}
