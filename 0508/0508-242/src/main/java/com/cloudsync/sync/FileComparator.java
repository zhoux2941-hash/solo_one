package com.cloudsync.sync;

import com.cloudsync.entity.FileInfo;
import com.cloudsync.entity.SyncTask;

import java.util.*;

public class FileComparator {

    public static class DiffResult {
        public List<SyncTask> uploadTasks = new ArrayList<>();
        public List<SyncTask> downloadTasks = new ArrayList<>();
        public List<SyncTask> deleteTasks = new ArrayList<>();
    }

    public DiffResult compare(List<FileInfo> localFiles, List<FileInfo> remoteFiles,
                              boolean uploadOnly, boolean downloadOnly) {
        DiffResult result = new DiffResult();

        Map<String, FileInfo> localMap = new HashMap<>();
        for (FileInfo file : localFiles) {
            localMap.put(file.getPath(), file);
        }

        Map<String, FileInfo> remoteMap = new HashMap<>();
        for (FileInfo file : remoteFiles) {
            remoteMap.put(file.getPath(), file);
        }

        Set<String> allPaths = new HashSet<>();
        allPaths.addAll(localMap.keySet());
        allPaths.addAll(remoteMap.keySet());

        for (String path : allPaths) {
            FileInfo local = localMap.get(path);
            FileInfo remote = remoteMap.get(path);

            if (local != null && remote == null) {
                if (!downloadOnly) {
                    if (local.isDirectory()) {
                        result.uploadTasks.add(new SyncTask(path, SyncTask.SyncType.UPLOAD_NEW, 0));
                    } else {
                        result.uploadTasks.add(new SyncTask(path, SyncTask.SyncType.UPLOAD_NEW, local.getSize()));
                    }
                }
            } else if (local == null && remote != null) {
                if (!uploadOnly) {
                    if (remote.isDirectory()) {
                        result.downloadTasks.add(new SyncTask(path, SyncTask.SyncType.DOWNLOAD_NEW, 0));
                    } else {
                        result.downloadTasks.add(new SyncTask(path, SyncTask.SyncType.DOWNLOAD_NEW, remote.getSize()));
                    }
                }
            } else if (local != null && remote != null) {
                if (!local.isDirectory() && !remote.isDirectory()) {
                    boolean contentChanged = !Objects.equals(local.getMd5(), remote.getMd5());
                    if (contentChanged) {
                        if (local.getLastModified() > remote.getLastModified()) {
                            if (!downloadOnly) {
                                result.uploadTasks.add(new SyncTask(path, SyncTask.SyncType.UPLOAD_MODIFY, local.getSize()));
                            }
                        } else if (remote.getLastModified() > local.getLastModified()) {
                            if (!uploadOnly) {
                                result.downloadTasks.add(new SyncTask(path, SyncTask.SyncType.DOWNLOAD_MODIFY, remote.getSize()));
                            }
                        }
                    }
                }
            }
        }

        return result;
    }
}
