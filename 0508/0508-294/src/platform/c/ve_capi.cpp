#include "ve/ve_capi.h"
#include "ve/ve.h"
#include "ve/editor.h"
#include "ve/utils/logger.h"

using namespace ve;

bool ve_initialize() {
    return ve::Initialize();
}

void ve_shutdown() {
    ve::Shutdown();
}

const char* ve_get_version() {
    return ve::GetVersion();
}

struct VEVideoEditor {
    VideoEditor* editor;
};

VEVideoEditor* ve_editor_create() {
    VEVideoEditor* ve = new VEVideoEditor();
    ve->editor = new VideoEditor();
    VE_LOG_INFO("C API: Editor created");
    return ve;
}

void ve_editor_destroy(VEVideoEditor* editor) {
    if (editor) {
        delete editor->editor;
        delete editor;
        VE_LOG_INFO("C API: Editor destroyed");
    }
}

void ve_editor_set_output_size(VEVideoEditor* editor, int width, int height) {
    if (editor) {
        editor->editor->SetOutputSize(Size(width, height));
    }
}

VESize ve_editor_get_output_size(VEVideoEditor* editor) {
    VESize size = {0, 0};
    if (editor) {
        Size s = editor->editor->GetOutputSize();
        size.width = s.width;
        size.height = s.height;
    }
    return size;
}

void ve_editor_set_output_framerate(VEVideoEditor* editor, double fps) {
    if (editor) {
        editor->editor->SetOutputFramerate(fps);
    }
}

double ve_editor_get_output_framerate(VEVideoEditor* editor) {
    return editor ? editor->editor->GetOutputFramerate() : 30.0;
}

int ve_editor_add_video_clip(VEVideoEditor* editor, const char* path) {
    if (!editor) return -1;
    auto clip = std::make_shared<VideoClip>(path);
    clip->Open();
    return editor->editor->AddVideoClip(clip);
}

int ve_editor_get_video_clip_count(VEVideoEditor* editor) {
    return editor ? editor->editor->GetVideoClipCount() : 0;
}

void ve_editor_set_clip_trim(VEVideoEditor* editor, int clip_index, double start, double end) {
    if (editor) {
        auto clip = editor->editor->GetVideoClip(clip_index);
        if (clip) {
            clip->SetTrim(start, end);
        }
    }
}

void ve_editor_set_clip_speed(VEVideoEditor* editor, int clip_index, float speed) {
    if (editor) {
        auto clip = editor->editor->GetVideoClip(clip_index);
        if (clip) {
            clip->SetSpeed(speed);
        }
    }
}

static TransitionType ConvertTransitionType(VETransitionType type) {
    switch (type) {
        case VE_TRANSITION_FADE: return TransitionType::Fade;
        case VE_TRANSITION_DISSOLVE: return TransitionType::Dissolve;
        case VE_TRANSITION_SLIDE_LEFT: return TransitionType::SlideLeft;
        case VE_TRANSITION_SLIDE_RIGHT: return TransitionType::SlideRight;
        case VE_TRANSITION_SLIDE_UP: return TransitionType::SlideUp;
        case VE_TRANSITION_SLIDE_DOWN: return TransitionType::SlideDown;
        case VE_TRANSITION_WIPE_LEFT: return TransitionType::WipeLeft;
        case VE_TRANSITION_WIPE_RIGHT: return TransitionType::WipeRight;
        case VE_TRANSITION_RIPPLE: return TransitionType::Ripple;
        case VE_TRANSITION_ZOOM: return TransitionType::Zoom;
        case VE_TRANSITION_ROTATE: return TransitionType::Rotate;
        default: return TransitionType::None;
    }
}

void ve_editor_set_transition(VEVideoEditor* editor, int clip_index,
                               VETransitionType type, double duration) {
    if (editor) {
        editor->editor->SetTransition(clip_index, ConvertTransitionType(type), duration);
    }
}

static FilterType ConvertFilterType(VEFilterType type) {
    switch (type) {
        case VE_FILTER_BRIGHTNESS: return FilterType::Brightness;
        case VE_FILTER_CONTRAST: return FilterType::Contrast;
        case VE_FILTER_SATURATION: return FilterType::Saturation;
        case VE_FILTER_GAUSSIAN_BLUR: return FilterType::GaussianBlur;
        case VE_FILTER_SHARPEN: return FilterType::Sharpen;
        case VE_FILTER_SEPIA: return FilterType::Sepia;
        case VE_FILTER_VIGNETTE: return FilterType::Vignette;
        default: return FilterType::None;
    }
}

int ve_editor_add_audio_clip(VEVideoEditor* editor, const char* path) {
    if (!editor) return -1;
    auto clip = std::make_shared<AudioClip>(path);
    return editor->editor->AddAudioClip(clip);
}

void ve_editor_set_audio_clip_start_time(VEVideoEditor* editor, int clip_index, double time) {
    if (editor) {
        auto clip = editor->editor->GetAudioClip(clip_index);
        if (clip) {
            clip->SetStartTime(time);
        }
    }
}

void ve_editor_set_audio_clip_volume(VEVideoEditor* editor, int clip_index, float volume) {
    if (editor) {
        auto clip = editor->editor->GetAudioClip(clip_index);
        if (clip) {
            clip->SetVolume(volume);
        }
    }
}

void ve_editor_add_filter(VEVideoEditor* editor, VEFilterType type) {
    if (editor) {
        editor->editor->AddFilter(ConvertFilterType(type));
    }
}

double ve_editor_get_total_duration(VEVideoEditor* editor) {
    return editor ? editor->editor->GetTotalDuration() : 0.0;
}

static void (*g_progress_callback)(float) = nullptr;
static void (*g_error_callback)(int, const char*) = nullptr;

bool ve_editor_export(VEVideoEditor* editor, const char* output_path,
                       void (*progress_callback)(float),
                       void (*error_callback)(int code, const char* message)) {
    if (!editor) return false;
    
    g_progress_callback = progress_callback;
    g_error_callback = error_callback;
    
    ProgressCallback progress_cb = nullptr;
    ErrorCallback error_cb = nullptr;
    
    if (progress_callback) {
        progress_cb = [](float progress) {
            if (g_progress_callback) g_progress_callback(progress);
        };
    }
    
    if (error_callback) {
        error_cb = [](int code, const char* msg) {
            if (g_error_callback) g_error_callback(code, msg);
        };
    }
    
    return editor->editor->Export(output_path, progress_cb, error_cb);
}

void ve_editor_cancel_export(VEVideoEditor* editor) {
    if (editor) {
        editor->editor->CancelExport();
    }
}
