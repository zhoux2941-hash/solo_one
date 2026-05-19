#pragma once

#include <vector>
#include <cstdint>
#include <string>

namespace hand_tracking_sdk {

struct QuantizationParams {
    float scale = 1.0f;
    int32_t zero_point = 0;
    float min_val = 0.0f;
    float max_val = 0.0f;
};

class Int8Quantizer {
public:
    Int8Quantizer();
    ~Int8Quantizer();

    bool Initialize(const std::string& model_path,
                    const std::vector<float>& calibration_data = {});

    void QuantizeTensor(const std::vector<float>& input,
                        std::vector<int8_t>& output,
                        QuantizationParams& params);

    void DequantizeTensor(const std::vector<int8_t>& input,
                          std::vector<float>& output,
                          const QuantizationParams& params);

    void OptimizeForMobile();
    void SetNumThreads(int num_threads);

    float GetQuantizationError() const;
    bool IsInitialized() const;

private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

class ModelOptimizer {
public:
    static bool QuantizeModel(const std::string& input_model,
                              const std::string& output_model,
                              const std::string& calibration_dataset);

    static bool PruneModel(const std::string& input_model,
                           const std::string& output_model,
                           float pruning_ratio = 0.3f);

    static std::vector<QuantizationParams> GetLayerQuantizationParams(
        const std::string& model_path);
};

}
