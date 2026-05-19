#pragma once

#include "ve/types.h"
#include "ve/transitions.h"
#include "ve/filters.h"

namespace ve {

class AudioSpeedController;

class VE_API VideoClip {
public:
    VideoClip(const std::string& path);
    ~VideoClip();
    
    bool Open();
    void Close();
    
    double GetDuration() const;
    Size GetSize() const;
    double GetFramerate() const;
    
    void SetTrim(double start_time, double end_time);
    double GetTrimStart() const;
    double GetTrimEnd() const;
    
    void SetSpeed(float speed);
    float GetSpeed() const;
    
    void SetSpeedCurve(const std::vector<SpeedPoint>& points);
    const std::vector<SpeedPoint>& GetSpeedCurve() const;
    
    void SetTimeRemap(const std::vector<TimeRemapPoint>& points);
    const std::vector<TimeRemapPoint>& GetTimeRemap() const;
    
    void SetVolume(float volume);
    float GetVolume() const;
    
    AudioSpeedController* GetAudioSpeedController() const;
    
    const std::string& GetPath() const;
    
private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

class VE_API AudioClip {
public:
    AudioClip(const std::string& path);
    ~AudioClip();
    
    bool Open();
    void Close();
    
    double GetDuration() const;
    void SetStartTime(double time);
    double GetStartTime() const;
    
    void SetTrim(double start_time, double end_time);
    double GetTrimStart() const;
    double GetTrimEnd() const;
    
    void SetVolume(float volume);
    float GetVolume() const;
    
    void SetLoop(bool loop);
    bool GetLoop() const;
    
    const std::string& GetPath() const;
    
private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

class VE_API Sticker {
public:
    Sticker(const std::string& image_path);
    ~Sticker();
    
    bool Load();
    void Unload();
    
    void SetPosition(const Vec2& pos);
    Vec2 GetPosition() const;
    
    void SetSize(const Size& size);
    Size GetSize() const;
    
    void SetRotation(float angle);
    float GetRotation() const;
    
    void SetScale(float scale);
    float GetScale() const;
    
    void SetOpacity(float opacity);
    float GetOpacity() const;
    
    void SetTimeRange(double start_time, double end_time);
    double GetStartTime() const;
    double GetEndTime() const;
    
private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

class VE_API TextOverlay {
public:
    TextOverlay(const std::string& text);
    ~TextOverlay();
    
    void SetText(const std::string& text);
    const std::string& GetText() const;
    
    void SetFont(const std::string& font_path, int size);
    const std::string& GetFontPath() const;
    int GetFontSize() const;
    
    void SetColor(const Color& color);
    Color GetColor() const;
    
    void SetPosition(const Vec2& pos);
    Vec2 GetPosition() const;
    
    void SetAlignment(int alignment);
    int GetAlignment() const;
    
    void SetTimeRange(double start_time, double end_time);
    double GetStartTime() const;
    double GetEndTime() const;
    
private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

class VE_API VideoEditor {
public:
    VideoEditor();
    ~VideoEditor();
    
    void SetOutputSize(const Size& size);
    Size GetOutputSize() const;
    
    void SetOutputFramerate(double fps);
    double GetOutputFramerate() const;
    
    void SetBackgroundColor(const Color& color);
    Color GetBackgroundColor() const;
    
    void SetOutputHDRType(HDRType type);
    HDRType GetOutputHDRType() const;
    
    void SetHDRMetadata(const HDRMetadata& metadata);
    const HDRMetadata& GetHDRMetadata() const;
    
    void EnableHDR10Plus(bool enable);
    bool IsHDR10PlusEnabled() const;
    
    void EnableDolbyVision(bool enable);
    bool IsDolbyVisionEnabled() const;
    
    int AddVideoClip(std::shared_ptr<VideoClip> clip);
    void RemoveVideoClip(int index);
    int GetVideoClipCount() const;
    std::shared_ptr<VideoClip> GetVideoClip(int index) const;
    
    void SetTransition(int clip_index, TransitionType type, double duration);
    TransitionType GetTransitionType(int clip_index) const;
    double GetTransitionDuration(int clip_index) const;
    
    int AddAudioClip(std::shared_ptr<AudioClip> clip);
    void RemoveAudioClip(int index);
    int GetAudioClipCount() const;
    std::shared_ptr<AudioClip> GetAudioClip(int index) const;
    
    int AddSticker(std::shared_ptr<Sticker> sticker);
    void RemoveSticker(int index);
    int GetStickerCount() const;
    std::shared_ptr<Sticker> GetSticker(int index) const;
    
    int AddTextOverlay(std::shared_ptr<TextOverlay> text);
    void RemoveTextOverlay(int index);
    int GetTextOverlayCount() const;
    std::shared_ptr<TextOverlay> GetTextOverlay(int index) const;
    
    void AddFilter(FilterType type, const std::map<std::string, float>& params = {});
    void RemoveFilter(int index);
    int GetFilterCount() const;
    
    double GetTotalDuration() const;
    
    bool Preview(double time, VideoFrame* frame);
    bool Export(const std::string& output_path, ProgressCallback progress = nullptr, ErrorCallback error = nullptr);
    
    void CancelExport();
    
private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

}
