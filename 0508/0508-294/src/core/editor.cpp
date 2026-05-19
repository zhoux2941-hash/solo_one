#include "ve/editor.h"
#include "ve/decoder.h"
#include "ve/renderer.h"
#include "ve/encoder.h"
#include "ve/filters.h"
#include "ve/transitions.h"
#include "ve/audio.h"
#include "ve/utils/logger.h"
#include "ve/utils/timer.h"
#include <algorithm>
#include <cmath>

namespace ve {

VideoFrame::VideoFrame() : width(0), height(0), format(PixelFormat::Unknown), pts(0), timestamp(0.0) {
    for (int i = 0; i < 4; i++) {
        data[i] = nullptr;
        linesize[i] = 0;
    }
}

VideoFrame::~VideoFrame() {
    Release();
}

void VideoFrame::Release() {
    for (int i = 0; i < 4; i++) {
        if (data[i]) {
            delete[] data[i];
            data[i] = nullptr;
        }
    }
}

AudioFrame::AudioFrame() : data(nullptr), sample_count(0), sample_rate(44100),
                          channels(2), pts(0), timestamp(0.0) {}

AudioFrame::~AudioFrame() {
    Release();
}

void AudioFrame::Release() {
    if (data) {
        delete[] data;
        data = nullptr;
    }
}

class VideoClip::Impl {
public:
    std::string path;
    double duration;
    Size size;
    double framerate;
    double trim_start;
    double trim_end;
    float speed;
    std::vector<SpeedPoint> speed_curve;
    std::vector<TimeRemapPoint> time_remap;
    float volume;
    std::unique_ptr<AudioSpeedController> audio_speed_controller;
    
    Impl(const std::string& p) : path(p), duration(0), framerate(30),
                                  trim_start(0), trim_end(0), speed(1.0f), volume(1.0f) {}
};

VideoClip::VideoClip(const std::string& path) : impl_(std::make_unique<Impl>(path)) {}
VideoClip::~VideoClip() = default;

bool VideoClip::Open() {
    VideoDecoder decoder;
    if (!decoder.Open(impl_->path)) return false;
    impl_->duration = decoder.GetDuration();
    impl_->size = decoder.GetSize();
    impl_->framerate = decoder.GetFramerate();
    if (impl_->trim_end == 0) impl_->trim_end = impl_->duration;
    return true;
}

void VideoClip::Close() {}
double VideoClip::GetDuration() const { return impl_->duration; }
Size VideoClip::GetSize() const { return impl_->size; }
double VideoClip::GetFramerate() const { return impl_->framerate; }
void VideoClip::SetTrim(double start, double end) { impl_->trim_start = start; impl_->trim_end = end; }
double VideoClip::GetTrimStart() const { return impl_->trim_start; }
double VideoClip::GetTrimEnd() const { return impl_->trim_end; }
void VideoClip::SetSpeed(float speed) {
    impl_->speed = speed;
    if (!impl_->audio_speed_controller) {
        impl_->audio_speed_controller = std::make_unique<AudioSpeedController>();
        impl_->audio_speed_controller->Initialize(44100, 2);
    }
    impl_->audio_speed_controller->SetSpeed(speed);
}
float VideoClip::GetSpeed() const { return impl_->speed; }
void VideoClip::SetSpeedCurve(const std::vector<SpeedPoint>& points) { impl_->speed_curve = points; }
const std::vector<SpeedPoint>& VideoClip::GetSpeedCurve() const { return impl_->speed_curve; }
void VideoClip::SetTimeRemap(const std::vector<TimeRemapPoint>& points) { impl_->time_remap = points; }
const std::vector<TimeRemapPoint>& VideoClip::GetTimeRemap() const { return impl_->time_remap; }
void VideoClip::SetVolume(float volume) { impl_->volume = volume; }
float VideoClip::GetVolume() const { return impl_->volume; }
AudioSpeedController* VideoClip::GetAudioSpeedController() const { return impl_->audio_speed_controller.get(); }
const std::string& VideoClip::GetPath() const { return impl_->path; }

class AudioClip::Impl {
public:
    std::string path;
    double duration;
    double start_time;
    double trim_start;
    double trim_end;
    float volume;
    bool loop;
    
    Impl(const std::string& p) : path(p), duration(0), start_time(0),
                                  trim_start(0), trim_end(0), volume(1.0f), loop(false) {}
};

AudioClip::AudioClip(const std::string& path) : impl_(std::make_unique<Impl>(path)) {}
AudioClip::~AudioClip() = default;
bool AudioClip::Open() { return true; }
void AudioClip::Close() {}
double AudioClip::GetDuration() const { return impl_->duration; }
void AudioClip::SetStartTime(double time) { impl_->start_time = time; }
double AudioClip::GetStartTime() const { return impl_->start_time; }
void AudioClip::SetTrim(double start, double end) { impl_->trim_start = start; impl_->trim_end = end; }
double AudioClip::GetTrimStart() const { return impl_->trim_start; }
double AudioClip::GetTrimEnd() const { return impl_->trim_end; }
void AudioClip::SetVolume(float volume) { impl_->volume = volume; }
float AudioClip::GetVolume() const { return impl_->volume; }
void AudioClip::SetLoop(bool loop) { impl_->loop = loop; }
bool AudioClip::GetLoop() const { return impl_->loop; }
const std::string& AudioClip::GetPath() const { return impl_->path; }

class Sticker::Impl {
public:
    std::string image_path;
    Vec2 position;
    Size size;
    float rotation;
    float scale;
    float opacity;
    double start_time;
    double end_time;
    
    Impl(const std::string& path) : image_path(path), position(0, 0), size(100, 100),
                                    rotation(0), scale(1.0f), opacity(1.0f),
                                    start_time(0), end_time(1e9) {}
};

Sticker::Sticker(const std::string& path) : impl_(std::make_unique<Impl>(path)) {}
Sticker::~Sticker() = default;
bool Sticker::Load() { return true; }
void Sticker::Unload() {}
void Sticker::SetPosition(const Vec2& pos) { impl_->position = pos; }
Vec2 Sticker::GetPosition() const { return impl_->position; }
void Sticker::SetSize(const Size& s) { impl_->size = s; }
Size Sticker::GetSize() const { return impl_->size; }
void Sticker::SetRotation(float angle) { impl_->rotation = angle; }
float Sticker::GetRotation() const { return impl_->rotation; }
void Sticker::SetScale(float s) { impl_->scale = s; }
float Sticker::GetScale() const { return impl_->scale; }
void Sticker::SetOpacity(float o) { impl_->opacity = o; }
float Sticker::GetOpacity() const { return impl_->opacity; }
void Sticker::SetTimeRange(double start, double end) { impl_->start_time = start; impl_->end_time = end; }
double Sticker::GetStartTime() const { return impl_->start_time; }
double Sticker::GetEndTime() const { return impl_->end_time; }

class TextOverlay::Impl {
public:
    std::string text;
    std::string font_path;
    int font_size;
    Color color;
    Vec2 position;
    int alignment;
    double start_time;
    double end_time;
    
    Impl(const std::string& t) : text(t), font_size(24), color(Color::White()),
                                  position(0, 0), alignment(0), start_time(0), end_time(1e9) {}
};

TextOverlay::TextOverlay(const std::string& text) : impl_(std::make_unique<Impl>(text)) {}
TextOverlay::~TextOverlay() = default;
void TextOverlay::SetText(const std::string& t) { impl_->text = t; }
const std::string& TextOverlay::GetText() const { return impl_->text; }
void TextOverlay::SetFont(const std::string& path, int size) { impl_->font_path = path; impl_->font_size = size; }
const std::string& TextOverlay::GetFontPath() const { return impl_->font_path; }
int TextOverlay::GetFontSize() const { return impl_->font_size; }
void TextOverlay::SetColor(const Color& c) { impl_->color = c; }
Color TextOverlay::GetColor() const { return impl_->color; }
void TextOverlay::SetPosition(const Vec2& pos) { impl_->position = pos; }
Vec2 TextOverlay::GetPosition() const { return impl_->position; }
void TextOverlay::SetAlignment(int a) { impl_->alignment = a; }
int TextOverlay::GetAlignment() const { return impl_->alignment; }
void TextOverlay::SetTimeRange(double start, double end) { impl_->start_time = start; impl_->end_time = end; }
double TextOverlay::GetStartTime() const { return impl_->start_time; }
double TextOverlay::GetEndTime() const { return impl_->end_time; }

struct TransitionInfo {
    TransitionType type;
    double duration;
};

class VideoEditor::Impl {
public:
    Size output_size;
    double output_framerate;
    Color background_color;
    HDRType output_hdr_type;
    HDRMetadata hdr_metadata;
    bool enable_hdr10_plus;
    bool enable_dolby_vision;
    std::vector<std::shared_ptr<VideoClip>> video_clips;
    std::vector<std::shared_ptr<AudioClip>> audio_clips;
    std::vector<std::shared_ptr<Sticker>> stickers;
    std::vector<std::shared_ptr<TextOverlay>> texts;
    std::vector<TransitionInfo> transitions;
    std::vector<std::shared_ptr<Filter>> filters;
    bool cancel_export;
    
    Impl() : output_size(1920, 1080), output_framerate(30),
             background_color(Color::Black()), output_hdr_type(HDRType::SDR),
             enable_hdr10_plus(false), enable_dolby_vision(false),
             cancel_export(false) {}
};

VideoEditor::VideoEditor() : impl_(std::make_unique<Impl>()) {}
VideoEditor::~VideoEditor() = default;

void VideoEditor::SetOutputSize(const Size& size) { impl_->output_size = size; }
Size VideoEditor::GetOutputSize() const { return impl_->output_size; }
void VideoEditor::SetOutputFramerate(double fps) { impl_->output_framerate = fps; }
double VideoEditor::GetOutputFramerate() const { return impl_->output_framerate; }
void VideoEditor::SetBackgroundColor(const Color& color) { impl_->background_color = color; }
Color VideoEditor::GetBackgroundColor() const { return impl_->background_color; }

void VideoEditor::SetOutputHDRType(HDRType type) { impl_->output_hdr_type = type; }
HDRType VideoEditor::GetOutputHDRType() const { return impl_->output_hdr_type; }
void VideoEditor::SetHDRMetadata(const HDRMetadata& metadata) { impl_->hdr_metadata = metadata; }
const HDRMetadata& VideoEditor::GetHDRMetadata() const { return impl_->hdr_metadata; }
void VideoEditor::EnableHDR10Plus(bool enable) { impl_->enable_hdr10_plus = enable; }
bool VideoEditor::IsHDR10PlusEnabled() const { return impl_->enable_hdr10_plus; }
void VideoEditor::EnableDolbyVision(bool enable) { impl_->enable_dolby_vision = enable; }
bool VideoEditor::IsDolbyVisionEnabled() const { return impl_->enable_dolby_vision; }

int VideoEditor::AddVideoClip(std::shared_ptr<VideoClip> clip) {
    impl_->video_clips.push_back(clip);
    impl_->transitions.push_back({TransitionType::None, 0.0});
    return (int)impl_->video_clips.size() - 1;
}

void VideoEditor::RemoveVideoClip(int index) {
    if (index >= 0 && index < (int)impl_->video_clips.size()) {
        impl_->video_clips.erase(impl_->video_clips.begin() + index);
        if (index < (int)impl_->transitions.size()) {
            impl_->transitions.erase(impl_->transitions.begin() + index);
        }
    }
}

int VideoEditor::GetVideoClipCount() const { return (int)impl_->video_clips.size(); }
std::shared_ptr<VideoClip> VideoEditor::GetVideoClip(int index) const {
    return (index >= 0 && index < (int)impl_->video_clips.size()) ? impl_->video_clips[index] : nullptr;
}

void VideoEditor::SetTransition(int clip_index, TransitionType type, double duration) {
    if (clip_index >= 0 && clip_index < (int)impl_->transitions.size()) {
        impl_->transitions[clip_index] = {type, duration};
    }
}

TransitionType VideoEditor::GetTransitionType(int clip_index) const {
    return (clip_index >= 0 && clip_index < (int)impl_->transitions.size()) ?
           impl_->transitions[clip_index].type : TransitionType::None;
}

double VideoEditor::GetTransitionDuration(int clip_index) const {
    return (clip_index >= 0 && clip_index < (int)impl_->transitions.size()) ?
           impl_->transitions[clip_index].duration : 0.0;
}

int VideoEditor::AddAudioClip(std::shared_ptr<AudioClip> clip) {
    impl_->audio_clips.push_back(clip);
    return (int)impl_->audio_clips.size() - 1;
}

void VideoEditor::RemoveAudioClip(int index) {
    if (index >= 0 && index < (int)impl_->audio_clips.size()) {
        impl_->audio_clips.erase(impl_->audio_clips.begin() + index);
    }
}

int VideoEditor::GetAudioClipCount() const { return (int)impl_->audio_clips.size(); }
std::shared_ptr<AudioClip> VideoEditor::GetAudioClip(int index) const {
    return (index >= 0 && index < (int)impl_->audio_clips.size()) ? impl_->audio_clips[index] : nullptr;
}

int VideoEditor::AddSticker(std::shared_ptr<Sticker> sticker) {
    impl_->stickers.push_back(sticker);
    return (int)impl_->stickers.size() - 1;
}

void VideoEditor::RemoveSticker(int index) {
    if (index >= 0 && index < (int)impl_->stickers.size()) {
        impl_->stickers.erase(impl_->stickers.begin() + index);
    }
}

int VideoEditor::GetStickerCount() const { return (int)impl_->stickers.size(); }
std::shared_ptr<Sticker> VideoEditor::GetSticker(int index) const {
    return (index >= 0 && index < (int)impl_->stickers.size()) ? impl_->stickers[index] : nullptr;
}

int VideoEditor::AddTextOverlay(std::shared_ptr<TextOverlay> text) {
    impl_->texts.push_back(text);
    return (int)impl_->texts.size() - 1;
}

void VideoEditor::RemoveTextOverlay(int index) {
    if (index >= 0 && index < (int)impl_->texts.size()) {
        impl_->texts.erase(impl_->texts.begin() + index);
    }
}

int VideoEditor::GetTextOverlayCount() const { return (int)impl_->texts.size(); }
std::shared_ptr<TextOverlay> VideoEditor::GetTextOverlay(int index) const {
    return (index >= 0 && index < (int)impl_->texts.size()) ? impl_->texts[index] : nullptr;
}

void VideoEditor::AddFilter(FilterType type, const std::map<std::string, float>& params) {
    std::shared_ptr<Filter> filter;
    switch (type) {
        case FilterType::Brightness: filter = std::make_shared<BrightnessFilter>(); break;
        case FilterType::Contrast: filter = std::make_shared<ContrastFilter>(); break;
        case FilterType::Saturation: filter = std::make_shared<SaturationFilter>(); break;
        case FilterType::Sepia: filter = std::make_shared<SepiaFilter>(); break;
        case FilterType::Vignette: filter = std::make_shared<VignetteFilter>(); break;
        default: return;
    }
    for (auto& p : params) filter->SetParam(p.first, p.second);
    impl_->filters.push_back(filter);
}

void VideoEditor::RemoveFilter(int index) {
    if (index >= 0 && index < (int)impl_->filters.size()) {
        impl_->filters.erase(impl_->filters.begin() + index);
    }
}

int VideoEditor::GetFilterCount() const { return (int)impl_->filters.size(); }

double VideoEditor::GetTotalDuration() const {
    double total = 0;
    for (auto& clip : impl_->video_clips) {
        double clip_duration = (clip->GetTrimEnd() - clip->GetTrimStart()) / clip->GetSpeed();
        total += clip_duration;
    }
    for (auto& t : impl_->transitions) {
        total -= t.duration;
    }
    return total;
}

double CalculateSourceTime(std::shared_ptr<VideoClip> clip, double time) {
    double clip_duration = (clip->GetTrimEnd() - clip->GetTrimStart()) / clip->GetSpeed();
    
    if (!clip->GetTimeRemap().empty()) {
        auto& remap = clip->GetTimeRemap();
        for (size_t i = 1; i < remap.size(); i++) {
            if (time >= remap[i-1].output_time && time <= remap[i].output_time) {
                double t = (time - remap[i-1].output_time) / (remap[i].output_time - remap[i-1].output_time);
                return remap[i-1].input_time + t * (remap[i].input_time - remap[i-1].input_time);
            }
        }
    }
    
    if (!clip->GetSpeedCurve().empty()) {
        auto& curve = clip->GetSpeedCurve();
        double result = 0;
        double current_time = 0;
        for (size_t i = 1; i < curve.size(); i++) {
            double segment_duration = curve[i].time - curve[i-1].time;
            double avg_speed = (curve[i-1].speed + curve[i].speed) / 2.0f;
            double scaled_duration = segment_duration / avg_speed;
            if (current_time + scaled_duration >= time) {
                double t = (time - current_time) / scaled_duration;
                return result + t * segment_duration;
            }
            current_time += scaled_duration;
            result += segment_duration;
        }
    }
    
    return clip->GetTrimStart() + time * clip->GetSpeed();
}

bool VideoEditor::Preview(double time, VideoFrame* frame) {
    if (impl_->video_clips.empty()) return false;
    
    double accum_time = 0;
    for (size_t i = 0; i < impl_->video_clips.size(); i++) {
        auto clip = impl_->video_clips[i];
        double clip_duration = (clip->GetTrimEnd() - clip->GetTrimStart()) / clip->GetSpeed();
        
        bool in_transition = false;
        double transition_progress = 0;
        if (i > 0 && impl_->transitions[i].duration > 0) {
            double transition_start = accum_time - impl_->transitions[i].duration;
            if (time >= transition_start && time < accum_time) {
                in_transition = true;
                transition_progress = (time - transition_start) / impl_->transitions[i].duration;
            }
        }
        
        if (time >= accum_time && time < accum_time + clip_duration) {
            double source_time = CalculateSourceTime(clip, time - accum_time);
            VideoDecoder decoder;
            if (decoder.Open(clip->GetPath())) {
                decoder.Seek(source_time);
                if (decoder.DecodeFrame(frame)) {
                    return true;
                }
            }
            return false;
        }
        accum_time += clip_duration - (i < impl_->video_clips.size() - 1 ? impl_->transitions[i+1].duration : 0);
    }
    return false;
}

bool VideoEditor::Export(const std::string& output_path, ProgressCallback progress, ErrorCallback error) {
    VE_LOG_INFO("Starting export: %s", output_path.c_str());
    Timer total_timer;
    
    impl_->cancel_export = false;
    
    for (auto& clip : impl_->video_clips) {
        clip->Open();
    }
    
    GLRenderer renderer;
    bool enable_hdr = impl_->output_hdr_type != HDRType::SDR;
    if (!renderer.Initialize(impl_->output_size, enable_hdr)) {
        if (error) error(-1, "Failed to initialize renderer");
        return false;
    }
    
    if (enable_hdr) {
        renderer.SetHDRMetadata(impl_->hdr_metadata);
    }
    
    FilterChain filter_chain;
    filter_chain.Initialize(impl_->output_size);
    for (auto& f : impl_->filters) {
        f->Initialize();
        filter_chain.AddFilter(f);
    }
    
    EncoderConfig config;
    config.output_path = output_path;
    config.size = impl_->output_size;
    config.framerate = impl_->output_framerate;
    config.bitrate = enable_hdr ? 16000000 : 8000000;
    config.output_hdr_type = impl_->output_hdr_type;
    config.hdr_metadata = impl_->hdr_metadata;
    config.enable_hdr10_plus = impl_->enable_hdr10_plus;
    config.enable_dolby_vision = impl_->enable_dolby_vision;
    
    if (impl_->output_hdr_type == HDRType::HDR10) {
        config.SetHDR10Defaults();
    } else if (impl_->output_hdr_type == HDRType::HLG) {
        config.SetHLGDefaults();
    } else if (impl_->output_hdr_type == HDRType::DolbyVision) {
        config.SetDolbyVisionDefaults();
    }
    
    VideoEncoder encoder;
    if (!encoder.Open(config)) {
        if (error) error(-2, "Failed to open encoder");
        return false;
    }
    
    double total_duration = GetTotalDuration();
    int total_frames = (int)(total_duration * impl_->output_framerate);
    
    VE_LOG_INFO("Total duration: %.2fs, Total frames: %d", total_duration, total_frames);
    
    Timer frame_timer;
    int frames_processed = 0;
    
    for (int frame_idx = 0; frame_idx < total_frames && !impl_->cancel_export; frame_idx++) {
        double time = frame_idx / impl_->output_framerate;
        
        VideoFrame frame;
        if (!Preview(time, &frame)) {
            continue;
        }
        
        VideoFrame output_frame;
        output_frame.width = impl_->output_size.width;
        output_frame.height = impl_->output_size.height;
        output_frame.format = enable_hdr ? PixelFormat::RGBA16F : PixelFormat::RGBA;
        output_frame.hdr_metadata = impl_->hdr_metadata;
        
        int buffer_size;
        if (enable_hdr) {
            buffer_size = output_frame.width * output_frame.height * 4 * sizeof(float);
            output_frame.data[0] = new uint8_t[buffer_size];
            output_frame.linesize[0] = output_frame.width * 4 * sizeof(float);
        } else {
            buffer_size = output_frame.width * output_frame.height * 4;
            output_frame.data[0] = new uint8_t[buffer_size];
            output_frame.linesize[0] = output_frame.width * 4;
        }
        
        if (frame.width == impl_->output_size.width && frame.height == impl_->output_size.height) {
            memcpy(output_frame.data[0], frame.data[0], buffer_size);
        } else {
            memset(output_frame.data[0], 0, buffer_size);
        }
        
        if (!encoder.EncodeVideoFrame(&output_frame)) {
            VE_LOG_ERROR("Failed to encode frame %d", frame_idx);
        }
        
        frame.Release();
        output_frame.Release();
        
        frames_processed++;
        
        if (frame_idx % 30 == 0 && progress) {
            progress((float)frame_idx / total_frames);
        }
    }
    
    encoder.Flush();
    encoder.Close();
    
    filter_chain.Shutdown();
    
    double elapsed = total_timer.Elapsed();
    double speed_ratio = total_duration / elapsed;
    
    VE_LOG_INFO("Export complete: %.2fs (exported in %.2fs, speed ratio: %.2fx)",
               total_duration, elapsed, speed_ratio);
    
    if (speed_ratio >= 1.0) {
        VE_LOG_INFO("Performance: REAL-TIME export achieved!");
    } else {
        VE_LOG_WARN("Performance: %.1f%% of real-time", speed_ratio * 100);
    }
    
    if (progress) progress(1.0f);
    
    return true;
}

void VideoEditor::CancelExport() {
    impl_->cancel_export = true;
}

}
