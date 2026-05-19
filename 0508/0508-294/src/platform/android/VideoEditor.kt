package com.videoeditor.sdk

class VideoEditorKt {
    private val editor = VideoEditor()

    var outputWidth: Int
        get() = editor.outputWidth
        set(value) {
            editor.setOutputSize(value, outputHeight)
        }

    var outputHeight: Int
        get() = editor.outputHeight
        set(value) {
            editor.setOutputSize(outputWidth, value)
        }

    var outputFramerate: Double
        get() = editor.outputFramerate
        set(value) {
            editor.setOutputFramerate(value)
        }

    val videoClipCount: Int
        get() = editor.videoClipCount

    val totalDuration: Double
        get() = editor.totalDuration

    enum class TransitionType(val value: Int) {
        NONE(0),
        FADE(1),
        DISSOLVE(2),
        SLIDE_LEFT(3),
        SLIDE_RIGHT(4),
        SLIDE_UP(5),
        SLIDE_DOWN(6),
        WIPE_LEFT(7),
        WIPE_RIGHT(8),
        RIPPLE(9),
        ZOOM(10),
        ROTATE(11)
    }

    enum class FilterType(val value: Int) {
        NONE(0),
        BRIGHTNESS(1),
        CONTRAST(2),
        SATURATION(3),
        GAUSSIAN_BLUR(4),
        SHARPEN(5),
        SEPIA(6),
        VIGNETTE(7)
    }

    fun addVideoClip(path: String): Int {
        return editor.addVideoClip(path)
    }

    fun setClipTrim(clipIndex: Int, start: Double, end: Double) {
        editor.setClipTrim(clipIndex, start, end)
    }

    fun setClipSpeed(clipIndex: Int, speed: Float) {
        editor.setClipSpeed(clipIndex, speed)
    }

    fun setTransition(clipIndex: Int, type: TransitionType, duration: Double) {
        editor.setTransition(clipIndex, type.value, duration)
    }

    fun addAudioClip(path: String): Int {
        return editor.addAudioClip(path)
    }

    fun setAudioClipStartTime(clipIndex: Int, time: Double) {
        editor.setAudioClipStartTime(clipIndex, time)
    }

    fun setAudioClipVolume(clipIndex: Int, volume: Float) {
        editor.setAudioClipVolume(clipIndex, volume)
    }

    fun addFilter(type: FilterType) {
        editor.addFilter(type.value)
    }

    fun export(
        outputPath: String,
        progress: ((Float) -> Unit)? = null,
        error: ((Int, String) -> Unit)? = null
    ): Boolean {
        val progressCallback = if (progress != null) {
            object : VideoEditor.ProgressCallback {
                override fun onProgress(p: Float) {
                    progress(p)
                }
            }
        } else null

        val errorCallback = if (error != null) {
            object : VideoEditor.ErrorCallback {
                override fun onError(code: Int, message: String) {
                    error(code, message)
                }
            }
        } else null

        return editor.export(outputPath, progressCallback, errorCallback)
    }

    fun cancelExport() {
        editor.cancelExport()
    }

    fun release() {
        editor.release()
    }
}
