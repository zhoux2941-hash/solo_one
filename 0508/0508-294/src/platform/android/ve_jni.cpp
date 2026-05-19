#include <jni.h>
#include "ve/ve.h"
#include "ve/editor.h"
#include "ve/utils/logger.h"

using namespace ve;

extern "C" {

JNIEXPORT jlong JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeCreateEditor(JNIEnv* env, jobject thiz) {
    VE_LOG_INFO("JNI: Creating editor");
    VideoEditor* editor = new VideoEditor();
    return reinterpret_cast<jlong>(editor);
}

JNIEXPORT void JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeDestroyEditor(JNIEnv* env, jobject thiz, jlong handle) {
    VE_LOG_INFO("JNI: Destroying editor");
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    delete editor;
}

JNIEXPORT void JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeSetOutputSize(JNIEnv* env, jobject thiz,
                                                          jlong handle, jint width, jint height) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    if (editor) {
        editor->SetOutputSize(Size(width, height));
    }
}

JNIEXPORT jintArray JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeGetOutputSize(JNIEnv* env, jobject thiz, jlong handle) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    jintArray result = env->NewIntArray(2);
    jint sizes[2] = {1920, 1080};
    if (editor) {
        Size s = editor->GetOutputSize();
        sizes[0] = s.width;
        sizes[1] = s.height;
    }
    env->SetIntArrayRegion(result, 0, 2, sizes);
    return result;
}

JNIEXPORT void JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeSetOutputFramerate(JNIEnv* env, jobject thiz,
                                                               jlong handle, jdouble fps) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    if (editor) {
        editor->SetOutputFramerate(fps);
    }
}

JNIEXPORT jdouble JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeGetOutputFramerate(JNIEnv* env, jobject thiz,
                                                               jlong handle) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    return editor ? editor->GetOutputFramerate() : 30.0;
}

JNIEXPORT jint JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeAddVideoClip(JNIEnv* env, jobject thiz,
                                                         jlong handle, jstring path) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    if (!editor) return -1;
    
    const char* c_path = env->GetStringUTFChars(path, nullptr);
    auto clip = std::make_shared<VideoClip>(std::string(c_path));
    clip->Open();
    int index = editor->AddVideoClip(clip);
    env->ReleaseStringUTFChars(path, c_path);
    return index;
}

JNIEXPORT jint JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeGetVideoClipCount(JNIEnv* env, jobject thiz,
                                                              jlong handle) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    return editor ? editor->GetVideoClipCount() : 0;
}

JNIEXPORT void JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeSetClipTrim(JNIEnv* env, jobject thiz,
                                                        jlong handle, jint clipIndex,
                                                        jdouble start, jdouble end) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    if (editor) {
        auto clip = editor->GetVideoClip(clipIndex);
        if (clip) {
            clip->SetTrim(start, end);
        }
    }
}

JNIEXPORT void JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeSetClipSpeed(JNIEnv* env, jobject thiz,
                                                         jlong handle, jint clipIndex, jfloat speed) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    if (editor) {
        auto clip = editor->GetVideoClip(clipIndex);
        if (clip) {
            clip->SetSpeed(speed);
        }
    }
}

static TransitionType ConvertTransitionType(int type) {
    switch (type) {
        case 1: return TransitionType::Fade;
        case 2: return TransitionType::Dissolve;
        case 3: return TransitionType::SlideLeft;
        case 4: return TransitionType::SlideRight;
        case 5: return TransitionType::SlideUp;
        case 6: return TransitionType::SlideDown;
        case 7: return TransitionType::WipeLeft;
        case 8: return TransitionType::WipeRight;
        case 9: return TransitionType::Ripple;
        case 10: return TransitionType::Zoom;
        case 11: return TransitionType::Rotate;
        default: return TransitionType::None;
    }
}

JNIEXPORT void JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeSetTransition(JNIEnv* env, jobject thiz,
                                                          jlong handle, jint clipIndex,
                                                          jint type, jdouble duration) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    if (editor) {
        editor->SetTransition(clipIndex, ConvertTransitionType(type), duration);
    }
}

JNIEXPORT jint JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeAddAudioClip(JNIEnv* env, jobject thiz,
                                                         jlong handle, jstring path) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    if (!editor) return -1;
    
    const char* c_path = env->GetStringUTFChars(path, nullptr);
    auto clip = std::make_shared<AudioClip>(std::string(c_path));
    int index = editor->AddAudioClip(clip);
    env->ReleaseStringUTFChars(path, c_path);
    return index;
}

JNIEXPORT void JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeSetAudioClipStartTime(JNIEnv* env, jobject thiz,
                                                                  jlong handle, jint clipIndex, jdouble time) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    if (editor) {
        auto clip = editor->GetAudioClip(clipIndex);
        if (clip) {
            clip->SetStartTime(time);
        }
    }
}

JNIEXPORT void JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeSetAudioClipVolume(JNIEnv* env, jobject thiz,
                                                               jlong handle, jint clipIndex, jfloat volume) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    if (editor) {
        auto clip = editor->GetAudioClip(clipIndex);
        if (clip) {
            clip->SetVolume(volume);
        }
    }
}

static FilterType ConvertFilterType(int type) {
    switch (type) {
        case 1: return FilterType::Brightness;
        case 2: return FilterType::Contrast;
        case 3: return FilterType::Saturation;
        case 4: return FilterType::GaussianBlur;
        case 5: return FilterType::Sharpen;
        case 6: return FilterType::Sepia;
        case 7: return FilterType::Vignette;
        default: return FilterType::None;
    }
}

JNIEXPORT void JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeAddFilter(JNIEnv* env, jobject thiz,
                                                      jlong handle, jint type) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    if (editor) {
        editor->AddFilter(ConvertFilterType(type));
    }
}

JNIEXPORT jdouble JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeGetTotalDuration(JNIEnv* env, jobject thiz,
                                                             jlong handle) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    return editor ? editor->GetTotalDuration() : 0.0;
}

struct JniCallbackData {
    JNIEnv* env;
    jobject progressCallback;
    jobject errorCallback;
    jmethodID progressMethod;
    jmethodID errorMethod;
};

JNIEXPORT jboolean JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeExport(JNIEnv* env, jobject thiz,
                                                   jlong handle, jstring outputPath,
                                                   jobject progressCallback,
                                                   jobject errorCallback) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    if (!editor) return JNI_FALSE;
    
    const char* c_path = env->GetStringUTFChars(outputPath, nullptr);
    std::string path(c_path);
    env->ReleaseStringUTFChars(outputPath, c_path);
    
    jclass progressClass = env->GetObjectClass(progressCallback);
    jclass errorClass = env->GetObjectClass(errorCallback);
    
    jmethodID progressMethod = env->GetMethodID(progressClass, "onProgress", "(F)V");
    jmethodID errorMethod = env->GetMethodID(errorClass, "onError", "(ILjava/lang/String;)V");
    
    ProgressCallback progress_cb = nullptr;
    ErrorCallback error_cb = nullptr;
    
    if (progressCallback && progressMethod) {
        progress_cb = [env, progressCallback, progressMethod](float progress) {
            env->CallVoidMethod(progressCallback, progressMethod, progress);
        };
    }
    
    if (errorCallback && errorMethod) {
        error_cb = [env, errorCallback, errorMethod](int code, const char* msg) {
            jstring jmsg = env->NewStringUTF(msg);
            env->CallVoidMethod(errorCallback, errorMethod, code, jmsg);
            env->DeleteLocalRef(jmsg);
        };
    }
    
    bool result = editor->Export(path, progress_cb, error_cb);
    return result ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT void JNICALL
Java_com_videoeditor_sdk_VideoEditor_nativeCancelExport(JNIEnv* env, jobject thiz, jlong handle) {
    VideoEditor* editor = reinterpret_cast<VideoEditor*>(handle);
    if (editor) {
        editor->CancelExport();
    }
}

}
