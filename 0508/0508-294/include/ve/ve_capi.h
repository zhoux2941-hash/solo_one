#pragma once

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#ifdef _WIN32
    #ifdef VE_EXPORTS
        #define VE_API __declspec(dllexport)
    #else
        #define VE_API __declspec(dllimport)
    #endif
#else
    #define VE_API __attribute__((visibility("default")))
#endif

typedef struct VESize {
    int width;
    int height;
} VESize;

typedef struct VEColor {
    float r, g, b, a;
} VEColor;

typedef struct VEVec2 {
    float x, y;
} VEVec2;

typedef enum VETransitionType {
    VE_TRANSITION_NONE,
    VE_TRANSITION_FADE,
    VE_TRANSITION_DISSOLVE,
    VE_TRANSITION_SLIDE_LEFT,
    VE_TRANSITION_SLIDE_RIGHT,
    VE_TRANSITION_SLIDE_UP,
    VE_TRANSITION_SLIDE_DOWN,
    VE_TRANSITION_WIPE_LEFT,
    VE_TRANSITION_WIPE_RIGHT,
    VE_TRANSITION_RIPPLE,
    VE_TRANSITION_ZOOM,
    VE_TRANSITION_ROTATE
} VETransitionType;

typedef enum VEFilterType {
    VE_FILTER_NONE,
    VE_FILTER_BRIGHTNESS,
    VE_FILTER_CONTRAST,
    VE_FILTER_SATURATION,
    VE_FILTER_GAUSSIAN_BLUR,
    VE_FILTER_SHARPEN,
    VE_FILTER_SEPIA,
    VE_FILTER_VIGNETTE
} VEFilterType;

VE_API bool ve_initialize();
VE_API void ve_shutdown();
VE_API const char* ve_get_version();

typedef struct VEVideoEditor VEVideoEditor;

VE_API VEVideoEditor* ve_editor_create();
VE_API void ve_editor_destroy(VEVideoEditor* editor);

VE_API void ve_editor_set_output_size(VEVideoEditor* editor, int width, int height);
VE_API VESize ve_editor_get_output_size(VEVideoEditor* editor);
VE_API void ve_editor_set_output_framerate(VEVideoEditor* editor, double fps);
VE_API double ve_editor_get_output_framerate(VEVideoEditor* editor);

VE_API int ve_editor_add_video_clip(VEVideoEditor* editor, const char* path);
VE_API int ve_editor_get_video_clip_count(VEVideoEditor* editor);
VE_API void ve_editor_set_clip_trim(VEVideoEditor* editor, int clip_index, double start, double end);
VE_API void ve_editor_set_clip_speed(VEVideoEditor* editor, int clip_index, float speed);

VE_API void ve_editor_set_transition(VEVideoEditor* editor, int clip_index,
                                      VETransitionType type, double duration);

VE_API int ve_editor_add_audio_clip(VEVideoEditor* editor, const char* path);
VE_API void ve_editor_set_audio_clip_start_time(VEVideoEditor* editor, int clip_index, double time);
VE_API void ve_editor_set_audio_clip_volume(VEVideoEditor* editor, int clip_index, float volume);

VE_API void ve_editor_add_filter(VEVideoEditor* editor, VEFilterType type);

VE_API double ve_editor_get_total_duration(VEVideoEditor* editor);

VE_API bool ve_editor_export(VEVideoEditor* editor, const char* output_path,
                              void (*progress_callback)(float),
                              void (*error_callback)(int code, const char* message));
VE_API void ve_editor_cancel_export(VEVideoEditor* editor);

#ifdef __cplusplus
}
#endif
