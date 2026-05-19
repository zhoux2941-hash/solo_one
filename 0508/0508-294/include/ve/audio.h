#pragma once

#include "ve/types.h"
#include <vector>

namespace ve {

class VE_API AudioMixer {
public:
    AudioMixer();
    ~AudioMixer();
    
    bool Initialize(int sample_rate, int channels);
    void Shutdown();
    
    void AddSource(const std::vector<float>& samples, float volume = 1.0f, float pan = 0.0f);
    void AddSource(const int16_t* samples, int sample_count, float volume = 1.0f, float pan = 0.0f);
    
    void SetMasterVolume(float volume);
    float GetMasterVolume() const;
    
    bool Mix(int16_t* output, int sample_count);
    bool Mix(float* output, int sample_count);
    
    void Reset();
    
private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

class VE_API AudioResampler {
public:
    AudioResampler();
    ~AudioResampler();
    
    bool Initialize(int in_sample_rate, int in_channels,
                    int out_sample_rate, int out_channels);
    void Shutdown();
    
    int Process(const int16_t* input, int input_samples,
                int16_t* output, int output_max_samples);
    
    int Process(const float* input, int input_samples,
                float* output, int output_max_samples);
    
    void Flush();
    
private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

class VE_API AudioSpeedController {
public:
    AudioSpeedController();
    ~AudioSpeedController();
    
    bool Initialize(int sample_rate, int channels);
    void Shutdown();
    
    void SetSpeed(float speed);
    float GetSpeed() const;
    
    int Process(const int16_t* input, int input_samples,
                int16_t* output, int output_max_samples);
    
    void Flush();
    void Reset();
    
private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

}
