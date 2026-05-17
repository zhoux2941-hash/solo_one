package com.cloudsync.entity;

import java.util.Objects;

public class FileInfo {
    private String path;
    private String name;
    private long size;
    private long lastModified;
    private boolean isDirectory;
    private String md5;

    public FileInfo() {}

    public FileInfo(String path, String name, long size, long lastModified, boolean isDirectory) {
        this.path = path;
        this.name = name;
        this.size = size;
        this.lastModified = lastModified;
        this.isDirectory = isDirectory;
    }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public long getSize() { return size; }
    public void setSize(long size) { this.size = size; }
    public long getLastModified() { return lastModified; }
    public void setLastModified(long lastModified) { this.lastModified = lastModified; }
    public boolean isDirectory() { return isDirectory; }
    public void setDirectory(boolean directory) { isDirectory = directory; }
    public String getMd5() { return md5; }
    public void setMd5(String md5) { this.md5 = md5; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FileInfo fileInfo = (FileInfo) o;
        return Objects.equals(path, fileInfo.path) &&
               Objects.equals(md5, fileInfo.md5);
    }

    @Override
    public int hashCode() {
        return Objects.hash(path, md5);
    }

    @Override
    public String toString() {
        return "FileInfo{path='" + path + "', name='" + name + "', size=" + size + "}";
    }
}
