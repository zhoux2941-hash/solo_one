#import "VEVideoEditor.h"
#include "ve/editor.h"

using namespace ve;

@interface VEVideoEditor () {
    VideoEditor* _editor;
}
@end

@implementation VEVideoEditor

- (instancetype)init {
    self = [super init];
    if (self) {
        _editor = new VideoEditor();
        _outputSize = CGSizeMake(1920, 1080);
        _outputFramerate = 30.0;
    }
    return self;
}

- (void)dealloc {
    delete _editor;
}

- (void)setOutputSize:(CGSize)outputSize {
    _outputSize = outputSize;
    _editor->SetOutputSize(Size(outputSize.width, outputSize.height));
}

- (void)setOutputFramerate:(double)outputFramerate {
    _outputFramerate = outputFramerate;
    _editor->SetOutputFramerate(outputFramerate);
}

- (NSInteger)videoClipCount {
    return _editor->GetVideoClipCount();
}

- (double)totalDuration {
    return _editor->GetTotalDuration();
}

- (NSInteger)addVideoClip:(NSString *)path {
    std::string cPath = [path UTF8String];
    auto clip = std::make_shared<VideoClip>(cPath);
    clip->Open();
    return _editor->AddVideoClip(clip);
}

- (void)setClipTrim:(NSInteger)clipIndex start:(double)start end:(double)end {
    auto clip = _editor->GetVideoClip((int)clipIndex);
    if (clip) {
        clip->SetTrim(start, end);
    }
}

- (void)setClipSpeed:(NSInteger)clipIndex speed:(float)speed {
    auto clip = _editor->GetVideoClip((int)clipIndex);
    if (clip) {
        clip->SetSpeed(speed);
    }
}

static TransitionType ConvertTransitionType(VETransitionType type) {
    switch (type) {
        case VETransitionTypeFade: return TransitionType::Fade;
        case VETransitionTypeDissolve: return TransitionType::Dissolve;
        case VETransitionTypeSlideLeft: return TransitionType::SlideLeft;
        case VETransitionTypeSlideRight: return TransitionType::SlideRight;
        case VETransitionTypeSlideUp: return TransitionType::SlideUp;
        case VETransitionTypeSlideDown: return TransitionType::SlideDown;
        case VETransitionTypeWipeLeft: return TransitionType::WipeLeft;
        case VETransitionTypeWipeRight: return TransitionType::WipeRight;
        case VETransitionTypeRipple: return TransitionType::Ripple;
        case VETransitionTypeZoom: return TransitionType::Zoom;
        case VETransitionTypeRotate: return TransitionType::Rotate;
        default: return TransitionType::None;
    }
}

- (void)setTransition:(NSInteger)clipIndex type:(VETransitionType)type duration:(double)duration {
    _editor->SetTransition((int)clipIndex, ConvertTransitionType(type), duration);
}

- (NSInteger)addAudioClip:(NSString *)path {
    std::string cPath = [path UTF8String];
    auto clip = std::make_shared<AudioClip>(cPath);
    return _editor->AddAudioClip(clip);
}

- (void)setAudioClipStartTime:(NSInteger)clipIndex time:(double)time {
    auto clip = _editor->GetAudioClip((int)clipIndex);
    if (clip) {
        clip->SetStartTime(time);
    }
}

- (void)setAudioClipVolume:(NSInteger)clipIndex volume:(float)volume {
    auto clip = _editor->GetAudioClip((int)clipIndex);
    if (clip) {
        clip->SetVolume(volume);
    }
}

static FilterType ConvertFilterType(VEFilterType type) {
    switch (type) {
        case VEFilterTypeBrightness: return FilterType::Brightness;
        case VEFilterTypeContrast: return FilterType::Contrast;
        case VEFilterTypeSaturation: return FilterType::Saturation;
        case VEFilterTypeGaussianBlur: return FilterType::GaussianBlur;
        case VEFilterTypeSharpen: return FilterType::Sharpen;
        case VEFilterTypeSepia: return FilterType::Sepia;
        case VEFilterTypeVignette: return FilterType::Vignette;
        default: return FilterType::None;
    }
}

- (void)addFilter:(VEFilterType)type {
    _editor->AddFilter(ConvertFilterType(type));
}

- (BOOL)export:(NSString *)outputPath
      progress:(void (^)(float progress))progressCallback
         error:(void (^)(NSInteger code, NSString *message))errorCallback {
    std::string cPath = [outputPath UTF8String];
    
    ProgressCallback progress_cb = nullptr;
    ErrorCallback error_cb = nullptr;
    
    if (progressCallback) {
        progress_cb = [progressCallback](float progress) {
            progressCallback(progress);
        };
    }
    
    if (errorCallback) {
        error_cb = [errorCallback](int code, const char* msg) {
            NSString* message = [NSString stringWithUTF8String:msg];
            errorCallback(code, message);
        };
    }
    
    return _editor->Export(cPath, progress_cb, error_cb);
}

- (void)cancelExport {
    _editor->CancelExport();
}

@end
