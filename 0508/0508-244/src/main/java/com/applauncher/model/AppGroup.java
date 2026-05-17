package com.applauncher.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

public class AppGroup implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String id;
    private String name;
    private String description;
    private List<Application> applications;
    private int displayOrder;
    private SortType sortType = SortType.MANUAL;

    public AppGroup() {
        this.id = java.util.UUID.randomUUID().toString();
        this.applications = new ArrayList<>();
        this.displayOrder = 0;
    }

    public AppGroup(String name) {
        this();
        this.name = name;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Application> getApplications() {
        return applications;
    }

    public void setApplications(List<Application> applications) {
        this.applications = applications;
        sortApplications();
    }

    public void addApplication(Application app) {
        if (!applications.contains(app)) {
            applications.add(app);
            sortApplications();
        }
    }

    public void removeApplication(Application app) {
        applications.remove(app);
    }

    public void moveApplication(int fromIndex, int toIndex) {
        if (fromIndex >= 0 && fromIndex < applications.size() && 
            toIndex >= 0 && toIndex < applications.size()) {
            sortType = SortType.MANUAL;
            Application app = applications.remove(fromIndex);
            applications.add(toIndex, app);
            updatePriorities();
        }
    }

    private void updatePriorities() {
        for (int i = 0; i < applications.size(); i++) {
            applications.get(i).setPriority(i);
        }
    }

    public void sortApplications() {
        if (sortType == null) {
            sortType = SortType.MANUAL;
        }
        
        List<Application> pinned = new ArrayList<>();
        List<Application> unpinned = new ArrayList<>();
        
        for (Application app : applications) {
            if (app.isPinned()) {
                pinned.add(app);
            } else {
                unpinned.add(app);
            }
        }
        
        switch (sortType) {
            case LAST_LAUNCH_TIME:
                unpinned.sort(Comparator.comparingLong(Application::getLastLaunchTime).reversed());
                break;
            case LAUNCH_COUNT:
                unpinned.sort(Comparator.comparingInt(Application::getLaunchCount).reversed());
                break;
            case NAME:
                unpinned.sort(Comparator.comparing(Application::getName, String.CASE_INSENSITIVE_ORDER));
                break;
            case MANUAL:
            default:
                unpinned.sort(Comparator.comparingInt(Application::getPriority));
                break;
        }
        
        applications.clear();
        applications.addAll(pinned);
        applications.addAll(unpinned);
    }

    public SortType getSortType() {
        return sortType;
    }

    public void setSortType(SortType sortType) {
        this.sortType = sortType;
        sortApplications();
    }

    public List<Application> getPinnedApplications() {
        List<Application> pinned = new ArrayList<>();
        for (Application app : applications) {
            if (app.isPinned()) {
                pinned.add(app);
            }
        }
        return pinned;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(int displayOrder) {
        this.displayOrder = displayOrder;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AppGroup appGroup = (AppGroup) o;
        return Objects.equals(id, appGroup.id);
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
