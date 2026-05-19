package com.videoeditor.sdk;

public class VideoEditor {
    static {
        System.loadLibrary("ve");
    }

    private native long nativeCreateEditor();
    private native void nativeDestroyEditor(long handle);
    private native void nativeSetOutputSize(long handle, int width, int height);
    private native int[] nativeGetOutputSize(long handle);
    private native void nativeSetOutputFramerate(long handle, double fps);
    private native double nativeGetOutputFramerate(long handle);
    private native int nativeAddVideoClip(long handle, String path);
    private native int nativeGetVideoClipCount(long handle);
    private native void nativeSetClipTrim(long handle, int clipIndex, double start, double end);
    private native void nativeSetClipSpeed(long handle, int clipIndex, float speed);
    private native void nativeSetTransition(long handle, int clipIndex, int type, double duration);
    private native int nativeAddAudioClip(long handle, String path);
    private native void nativeSetAudioClipStartTime(long handle, int clipIndex, double time);
    private native void nativeSetAudioClipVolume(long handle, int clipIndex, float volume);
    private native void nativeAddFilter(long handle, int type);
    private native double nativeGetTotalDuration(long handle);
    private native boolean nativeExport(long handle, String outputPath,
                                         ProgressCallback progressCallback,
                                         ErrorCallback errorCallback);
    private native void nativeCancelExport(long handle);

    private long nativeHandle;

    public interface ProgressCallback {
        void onProgress(float progress);
    }

    public interface ErrorCallback {
        void onError(int code, String message);
    }

    public static class TransitionType {
        public static final int NONE = 0;
        public static final int FADE = 1;
        public static final int DISSOLVE = 2;
        public static final int SLIDE_LEFT = 3;
        public static final int SLIDE_RIGHT = 4;
        public static final int SLIDE_UP = 5;
        public static final int SLIDE_DOWN = 6;
        public static final int WIPE_LEFT = 7;
        public static final int WIPE_RIGHT = 8;
        public static final int RIPPLE = 9;
        public static final int ZOOM = 10;
        public static final int ROTATE = 11;
    }

    public static class FilterType {
        public static final int NONE = 0;
        public static final int BRIGHTNESS = 1;
        public static final int CONTRAST = 2;
        public static final int SATURATION = 3;
        public static final int GAUSSIAN_BLUR = 4;
        public static final int SHARPEN = 5;
        public static final int SEPIA = 6;
        public static final int VIGNETTE = 7;
    }

    public VideoEditor() {
        nativeHandle = nativeCreateEditor();
    }

    public void release() {
        if (nativeHandle != 0) {
            nativeDestroyEditor(nativeHandle);
            nativeHandle = 0;
        }
    }

    public void setOutputSize(int width, int height) {
        nativeSetOutputSize(nativeHandle, width, height);
    }

    public int getOutputWidth() {
        return nativeGetOutputSize(nativeHandle)[0];
    }

    public int getOutputHeight() {
        return nativeGetOutputSize(nativeHandle)[1];
    }

    public void setOutputFramerate(double fps) {
        nativeSetOutputFramerate(nativeHandle, fps);
    }

    public double getOutputFramerate() {
        return nativeGetOutputFramerate(nativeHandle);
    }

    public int addVideoClip(String path) {
        return nativeAddVideoClip(nativeHandle, path);
    }

    public int getVideoClipCount() {
        return nativeGetVideoClipCount(nativeHandle);
    }

    public void setClipTrim(int clipIndex, double startTime, double endTime) {
        nativeSetClipTrim(nativeHandle, clipIndex, startTime, endTime);
    }

    public void setClipSpeed(int clipIndex, float speed) {
        nativeSetClipSpeed(nativeHandle, clipIndex, speed);
    }

    public void setTransition(int clipIndex, int type, double duration) {
        nativeSetTransition(nativeHandle, clipIndex, type, duration);
    }

    public int addAudioClip(String path) {
        return nativeAddAudioClip(nativeHandle, path);
    }

    public void setAudioClipStartTime(int clipIndex, double time) {
        nativeSetAudioClipStartTime(nativeHandle, clipIndex, time);
    }

    public void setAudioClipVolume(int clipIndex, float volume) {
        nativeSetAudioClipVolume(nativeHandle, clipIndex, volume);
    }

    public void addFilter(int type) {
        nativeAddFilter(nativeHandle, type);
    }

    public double getTotalDuration() {
        return nativeGetTotalDuration(nativeHandle);
    }

    public boolean export(String outputPath,
                           ProgressCallback progressCallback,
                           ErrorCallback errorCallback) {
        return nativeExport(nativeHandle, outputPath, progressCallback, errorCallback);
    }

    public void cancelExport() {
        nativeCancelExport(nativeHandle);
    }
}
