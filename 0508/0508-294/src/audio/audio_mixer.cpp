#include "ve/audio.h"
#include "ve/utils/logger.h"
#include <algorithm>
#include <cmath>
#include <cstring>
#include <vector>

namespace ve {

class AudioMixer::Impl {
public:
    int sample_rate;
    int channels;
    float master_volume;
    std::vector<float> mix_buffer;
    
    Impl() : sample_rate(44100), channels(2), master_volume(1.0f) {}
};

AudioMixer::AudioMixer() : impl_(std::make_unique<Impl>()) {}
AudioMixer::~AudioMixer() = default;

bool AudioMixer::Initialize(int sample_rate, int channels) {
    impl_->sample_rate = sample_rate;
    impl_->channels = channels;
    impl_->mix_buffer.reserve(8192 * channels);
    return true;
}

void AudioMixer::Shutdown() {
    impl_->mix_buffer.clear();
}

void AudioMixer::AddSource(const std::vector<float>& samples, float volume, float pan) {
    if (samples.empty()) return;
    
    size_t needed = samples.size();
    if (impl_->mix_buffer.size() < needed) {
        impl_->mix_buffer.resize(needed, 0.0f);
    }
    
    for (size_t i = 0; i < samples.size(); i++) {
        impl_->mix_buffer[i] += samples[i] * volume * impl_->master_volume;
    }
}

void AudioMixer::AddSource(const int16_t* samples, int sample_count, float volume, float pan) {
    if (!samples || sample_count <= 0) return;
    
    int channels = impl_->channels;
    size_t needed = sample_count * channels;
    if (impl_->mix_buffer.size() < needed) {
        impl_->mix_buffer.resize(needed, 0.0f);
    }
    
    for (int i = 0; i < sample_count * channels; i++) {
        float sample = samples[i] / 32768.0f;
        impl_->mix_buffer[i] += sample * volume * impl_->master_volume;
    }
}

void AudioMixer::SetMasterVolume(float volume) { impl_->master_volume = volume; }
float AudioMixer::GetMasterVolume() const { return impl_->master_volume; }

bool AudioMixer::Mix(int16_t* output, int sample_count) {
    if (!output || sample_count <= 0) return false;
    
    int channels = impl_->channels;
    int total_samples = sample_count * channels;
    
    for (int i = 0; i < total_samples; i++) {
        float sample = 0.0f;
        if (i < (int)impl_->mix_buffer.size()) {
            sample = impl_->mix_buffer[i];
            impl_->mix_buffer[i] = 0.0f;
        }
        sample = std::max(-1.0f, std::min(1.0f, sample));
        output[i] = (int16_t)(sample * 32767.0f);
    }
    
    return true;
}

bool AudioMixer::Mix(float* output, int sample_count) {
    if (!output || sample_count <= 0) return false;
    
    int channels = impl_->channels;
    int total_samples = sample_count * channels;
    
    for (int i = 0; i < total_samples; i++) {
        if (i < (int)impl_->mix_buffer.size()) {
            output[i] = impl_->mix_buffer[i];
            impl_->mix_buffer[i] = 0.0f;
        } else {
            output[i] = 0.0f;
        }
    }
    
    return true;
}

void AudioMixer::Reset() {
    std::fill(impl_->mix_buffer.begin(), impl_->mix_buffer.end(), 0.0f);
}

class AudioResampler::Impl {
public:
    int in_sample_rate;
    int in_channels;
    int out_sample_rate;
    int out_channels;
    std::vector<float> filter_state;
    
    Impl() : in_sample_rate(44100), in_channels(2),
             out_sample_rate(44100), out_channels(2) {}
};

AudioResampler::AudioResampler() : impl_(std::make_unique<Impl>()) {}
AudioResampler::~AudioResampler() = default;

bool AudioResampler::Initialize(int in_sr, int in_ch, int out_sr, int out_ch) {
    impl_->in_sample_rate = in_sr;
    impl_->in_channels = in_ch;
    impl_->out_sample_rate = out_sr;
    impl_->out_channels = out_ch;
    impl_->filter_state.resize(in_ch * 8, 0.0f);
    VE_LOG_INFO("AudioResampler: %dHz/%dch -> %dHz/%dch", in_sr, in_ch, out_sr, out_ch);
    return true;
}

void AudioResampler::Shutdown() {
    impl_->filter_state.clear();
}

static float Sinc(float x) {
    if (std::abs(x) < 1e-8f) return 1.0f;
    return std::sin(x * (float)M_PI) / (x * (float)M_PI);
}

static float HannWindow(int n, int N) {
    return 0.5f * (1.0f - std::cos(2.0f * (float)M_PI * n / (N - 1)));
}

int AudioResampler::Process(const int16_t* input, int input_samples,
                            int16_t* output, int output_max_samples) {
    if (impl_->in_sample_rate == impl_->out_sample_rate &&
        impl_->in_channels == impl_->out_channels) {
        int count = std::min(input_samples, output_max_samples);
        memcpy(output, input, count * impl_->in_channels * sizeof(int16_t));
        return count;
    }
    
    float ratio = (float)impl_->out_sample_rate / impl_->in_sample_rate;
    int output_samples = (int)(input_samples * ratio);
    output_samples = std::min(output_samples, output_max_samples);
    
    int in_ch = impl_->in_channels;
    int out_ch = impl_->out_channels;
    
    for (int ch = 0; ch < std::min(in_ch, out_ch); ch++) {
        for (int i = 0; i < output_samples; i++) {
            float pos = i / ratio;
            int ipos = (int)pos;
            float frac = pos - ipos;
            
            float sum = 0.0f;
            int taps = 4;
            
            for (int t = -taps; t <= taps; t++) {
                int idx = ipos + t;
                if (idx >= 0 && idx < input_samples) {
                    float x = (t - frac);
                    float sinc = Sinc(x);
                    float window = HannWindow(t + taps, 2 * taps + 1);
                    float sample = input[idx * in_ch + ch] / 32768.0f;
                    sum += sample * sinc * window;
                }
            }
            
            output[i * out_ch + ch] = (int16_t)(std::max(-1.0f, std::min(1.0f, sum)) * 32767.0f);
        }
    }
    
    if (in_ch == 1 && out_ch == 2) {
        for (int i = 0; i < output_samples; i++) {
            output[i * 2 + 1] = output[i * 2];
        }
    }
    
    return output_samples;
}

int AudioResampler::Process(const float* input, int input_samples,
                            float* output, int output_max_samples) {
    return 0;
}

void AudioResampler::Flush() {
    std::fill(impl_->filter_state.begin(), impl_->filter_state.end(), 0.0f);
}

class SOLA {
public:
    static const int FRAME_SIZE = 1024;
    static const int OVERLAP_SIZE = 512;
    static const int SYNC_WINDOW = 256;
    
    SOLA(int sample_rate, int channels)
        : sample_rate_(sample_rate), channels_(channels), speed_(1.0f) {
        history_.resize(channels * FRAME_SIZE * 4, 0.0f);
        overlap_.resize(channels * OVERLAP_SIZE, 0.0f);
        window_.resize(OVERLAP_SIZE);
        
        for (int i = 0; i < OVERLAP_SIZE; i++) {
            window_[i] = 0.5f * (1.0f - std::cos(2.0f * (float)M_PI * i / (OVERLAP_SIZE - 1)));
        }
        
        Reset();
    }
    
    void SetSpeed(float speed) {
        speed_ = std::max(0.25f, std::min(4.0f, speed));
    }
    
    float GetSpeed() const { return speed_; }
    
    int Process(const float* input, int input_samples,
                float* output, int output_max_samples) {
        int produced = 0;
        int input_idx = 0;
        
        while (input_idx + FRAME_SIZE <= input_samples && produced + FRAME_SIZE <= output_max_samples) {
            for (int ch = 0; ch < channels_; ch++) {
                for (int i = 0; i < FRAME_SIZE; i++) {
                    history_[(history_pos_ + i) * channels_ + ch] = input[(input_idx + i) * channels_ + ch];
                }
            }
            
            float nominal_offset = (FRAME_SIZE - OVERLAP_SIZE) * speed_;
            int best_offset = FindBestSync((int)nominal_offset);
            
            for (int ch = 0; ch < channels_; ch++) {
                for (int i = 0; i < OVERLAP_SIZE; i++) {
                    float a = overlap_[i * channels_ + ch];
                    float b = history_[(best_offset + i) * channels_ + ch];
                    float win = window_[i];
                    output[(produced + i) * channels_ + ch] = a * (1.0f - win) + b * win;
                }
                
                for (int i = OVERLAP_SIZE; i < FRAME_SIZE; i++) {
                    output[(produced + i) * channels_ + ch] = history_[(best_offset + i) * channels_ + ch];
                }
                
                for (int i = 0; i < OVERLAP_SIZE; i++) {
                    overlap_[i * channels_ + ch] = history_[(best_offset + FRAME_SIZE - OVERLAP_SIZE + i) * channels_ + ch];
                }
            }
            
            history_pos_ = (history_pos_ + FRAME_SIZE) % (int)(history_.size() / channels_);
            input_idx += FRAME_SIZE;
            produced += FRAME_SIZE - OVERLAP_SIZE;
        }
        
        return produced;
    }
    
    void Flush(float* output, int& output_samples, int output_max) {
        int produced = 0;
        for (int ch = 0; ch < channels_; ch++) {
            for (int i = 0; i < OVERLAP_SIZE && produced + i < output_max; i++) {
                output[(produced + i) * channels_ + ch] = overlap_[i * channels_ + ch] * window_[i];
            }
        }
        output_samples = OVERLAP_SIZE;
    }
    
    void Reset() {
        std::fill(history_.begin(), history_.end(), 0.0f);
        std::fill(overlap_.begin(), overlap_.end(), 0.0f);
        history_pos_ = 0;
        first_frame_ = true;
    }
    
private:
    int FindBestSync(int nominal) {
        if (first_frame_) {
            first_frame_ = false;
            return 0;
        }
        
        int best_offset = nominal;
        float max_correlation = -1e10f;
        
        int start = std::max(0, nominal - SYNC_WINDOW / 2);
        int end = nominal + SYNC_WINDOW / 2;
        
        for (int offset = start; offset <= end; offset++) {
            float correlation = 0.0f;
            for (int ch = 0; ch < channels_; ch++) {
                for (int i = 0; i < OVERLAP_SIZE; i++) {
                    float a = overlap_[i * channels_ + ch];
                    float b = history_[(offset + i) * channels_ + ch];
                    correlation += a * b * window_[i];
                }
            }
            
            if (correlation > max_correlation) {
                max_correlation = correlation;
                best_offset = offset;
            }
        }
        
        return best_offset;
    }
    
    int sample_rate_;
    int channels_;
    float speed_;
    std::vector<float> history_;
    std::vector<float> overlap_;
    std::vector<float> window_;
    int history_pos_ = 0;
    bool first_frame_ = true;
};

class AudioSpeedController::Impl {
public:
    int sample_rate;
    int channels;
    float speed;
    std::unique_ptr<SOLA> sola;
    std::vector<float> input_buffer;
    std::vector<float> output_buffer;
    
    Impl() : sample_rate(44100), channels(2), speed(1.0f) {}
};

AudioSpeedController::AudioSpeedController() : impl_(std::make_unique<Impl>()) {}
AudioSpeedController::~AudioSpeedController() = default;

bool AudioSpeedController::Initialize(int sample_rate, int channels) {
    impl_->sample_rate = sample_rate;
    impl_->channels = channels;
    impl_->sola = std::make_unique<SOLA>(sample_rate, channels);
    impl_->input_buffer.reserve(sample_rate * channels);
    impl_->output_buffer.reserve(sample_rate * channels * 2);
    
    VE_LOG_INFO("AudioSpeedController initialized: %dHz, %dch (SOLA algorithm - no pitch shift)",
                sample_rate, channels);
    return true;
}

void AudioSpeedController::Shutdown() {
    impl_->sola.reset();
    impl_->input_buffer.clear();
    impl_->output_buffer.clear();
}

void AudioSpeedController::SetSpeed(float speed) {
    impl_->speed = std::max(0.25f, std::min(4.0f, speed));
    impl_->sola->SetSpeed(speed);
    VE_LOG_INFO("Audio speed set to: %.2fx (SOLA - no pitch shift)", speed);
}

float AudioSpeedController::GetSpeed() const {
    return impl_->speed;
}

int AudioSpeedController::Process(const int16_t* input, int input_samples,
                                  int16_t* output, int output_max_samples) {
    if (impl_->speed == 1.0f) {
        int count = std::min(input_samples, output_max_samples);
        memcpy(output, input, count * impl_->channels * sizeof(int16_t));
        return count;
    }
    
    int channels = impl_->channels;
    
    impl_->input_buffer.resize(input_samples * channels);
    for (int i = 0; i < input_samples * channels; i++) {
        impl_->input_buffer[i] = input[i] / 32768.0f;
    }
    
    int output_size = (int)(input_samples / impl_->speed) + SOLA::FRAME_SIZE;
    impl_->output_buffer.resize(std::min(output_size, output_max_samples) * channels);
    
    int produced = impl_->sola->Process(
        impl_->input_buffer.data(),
        input_samples,
        impl_->output_buffer.data(),
        output_max_samples
    );
    
    produced = std::min(produced, output_max_samples);
    
    for (int i = 0; i < produced * channels; i++) {
        float sample = impl_->output_buffer[i];
        sample = std::max(-1.0f, std::min(1.0f, sample));
        output[i] = (int16_t)(sample * 32767.0f);
    }
    
    return produced;
}

void AudioSpeedController::Flush() {
    impl_->input_buffer.clear();
    impl_->output_buffer.clear();
}

void AudioSpeedController::Reset() {
    impl_->sola->Reset();
    Flush();
}

}
