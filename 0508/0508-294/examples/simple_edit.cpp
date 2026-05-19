#include "ve/ve.h"
#include "ve/editor.h"
#include "ve/utils/logger.h"
#include <iostream>
#include <memory>

using namespace ve;

int main(int argc, char* argv[]) {
    if (argc < 3) {
        std::cout << "Usage: simple_edit <input_video> <output_video>\n";
        return 1;
    }
    
    std::string inputPath = argv[1];
    std::string outputPath = argv[2];
    
    VE_LOG_INFO("=== VideoEditor SDK - Simple Edit Example ===");
    VE_LOG_INFO("Input: %s", inputPath.c_str());
    VE_LOG_INFO("Output: %s", outputPath.c_str());
    
    if (!Initialize()) {
        VE_LOG_ERROR("Failed to initialize SDK");
        return 1;
    }
    
    auto editor = std::make_unique<VideoEditor>();
    
    editor->SetOutputSize(Size(1920, 1080));
    editor->SetOutputFramerate(30.0);
    editor->SetBackgroundColor(Color(0, 0, 0, 1));
    
    int clip1 = editor->AddVideoClip(std::make_shared<VideoClip>(inputPath));
    if (clip1 < 0) {
        VE_LOG_ERROR("Failed to add video clip");
        Shutdown();
        return 1;
    }
    
    auto clip = editor->GetVideoClip(clip1);
    if (clip) {
        double duration = clip->GetDuration();
        VE_LOG_INFO("Video duration: %.2f seconds", duration);
        
        clip->SetTrim(0.0, std::min(duration, 10.0));
        clip->SetSpeed(1.0f);
        clip->SetVolume(0.8f);
    }
    
    editor->AddFilter(FilterType::Brightness, {{"brightness", 0.1f}});
    editor->AddFilter(FilterType::Contrast, {{"contrast", 1.1f}});
    editor->AddFilter(FilterType::Saturation, {{"saturation", 1.2f}});
    
    double totalDuration = editor->GetTotalDuration();
    VE_LOG_INFO("Total output duration: %.2f seconds", totalDuration);
    
    VE_LOG_INFO("Starting export...");
    
    bool success = editor->Export(outputPath,
        [](float progress) {
            if ((int)(progress * 100) % 10 == 0) {
                VE_LOG_INFO("Export progress: %.0f%%", progress * 100);
            }
        },
        [](int code, const char* message) {
            VE_LOG_ERROR("Export error (%d): %s", code, message);
        }
    );
    
    if (success) {
        VE_LOG_INFO("Export completed successfully!");
    } else {
        VE_LOG_ERROR("Export failed!");
    }
    
    Shutdown();
    
    return success ? 0 : 1;
}
