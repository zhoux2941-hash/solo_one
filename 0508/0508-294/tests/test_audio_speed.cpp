#include "ve/audio.h"
#include "ve/utils/logger.h"
#include <iostream>
#include <vector>
#include <cmath>

using namespace ve;

void GenerateSineWave(std::vector<int16_t>& buffer, int sample_rate, double frequency, double duration) {
    int samples = (int)(sample_rate * duration);
    buffer.resize(samples * 2);
    
    for (int i = 0; i < samples; i++) {
        double t = (double)i / sample_rate;
        double value = std::sin(2.0 * M_PI * frequency * t) * 0.5;
        int16_t sample = (int16_t)(value * 32767.0);
        buffer[i * 2] = sample;
        buffer[i * 2 + 1] = sample;
    }
}

void TestAudioSpeed(float speed) {
    const int sample_rate = 44100;
    const int channels = 2;
    
    std::cout << "\n=== Testing speed = " << speed << "x ===\n";
    
    std::vector<int16_t> input;
    GenerateSineWave(input, sample_rate, 440.0, 1.0);
    
    AudioSpeedController controller;
    controller.Initialize(sample_rate, channels);
    controller.SetSpeed(speed);
    
    std::vector<int16_t> output;
    output.resize((size_t)(input.size() / speed + 10000));
    
    int produced = controller.Process(input.data(), (int)(input.size() / channels),
                                       output.data(), (int)(output.size() / channels));
    
    std::cout << "Input samples: " << input.size() / channels << "\n";
    std::cout << "Output samples: " << produced << "\n";
    std::cout << "Expected ratio: " << (float)produced / (input.size() / channels) << "\n";
    std::cout << "Target ratio: " << 1.0f / speed << "\n";
}

int main() {
    Logger::SetLevel(LogLevel::Debug);
    
    VE_LOG_INFO("Audio Speed Controller Test - WSOLA Algorithm");
    
    TestAudioSpeed(0.5f);
    TestAudioSpeed(0.75f);
    TestAudioSpeed(1.0f);
    TestAudioSpeed(1.5f);
    TestAudioSpeed(2.0f);
    
    VE_LOG_INFO("All tests completed!");
    
    return 0;
}
