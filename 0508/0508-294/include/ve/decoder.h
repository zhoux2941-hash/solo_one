#pragma once

#include "ve/types.h"

namespace ve {

class VE_API VideoDecoder {
public:
    VideoDecoder();
    ~VideoDecoder();
    
    bool Open(const std::string& path);
    void Close();
    
    Size GetSize() const;
    double GetDuration() const;
    double GetFramerate() const;
    int GetRotation() const;
    
    HDRType GetHDRType() const;
    const HDRMetadata& GetHDRMetadata() const;
    int GetBitDepth() const;
    bool IsHDR() const;
    
    bool Seek(double time);
    bool DecodeFrame(VideoFrame* frame);
    
    void SetSpeed(float speed);
    float GetSpeed() const;
    
    double GetCurrentTime() const;
    
    bool HasAudio() const;
    bool DecodeAudio(AudioFrame* frame);
    
private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

class VE_API AudioDecoder {
public:
    AudioDecoder();
    ~AudioDecoder();
    
    bool Open(const std::string& path);
    void Close();
    
    double GetDuration() const;
    int GetSampleRate() const;
    int GetChannels() const;
    
    bool Seek(double time);
    bool DecodeFrame(AudioFrame* frame);
    
    double GetCurrentTime() const;
    
private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

}
