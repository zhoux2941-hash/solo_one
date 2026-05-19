#include "hand_tracking_sdk/quantization.h"
#include <cmath>
#include <algorithm>
#include <stdexcept>

namespace hand_tracking_sdk {

class Int8Quantizer::Impl {
public:
    Impl() : initialized_(false), num_threads_(1), quantization_error_(0.0f) {}

    bool Initialize(const std::string& model_path, const std::vector<float>& calibration_data) {
        model_path_ = model_path;
        calibration_data_ = calibration_data;
        initialized_ = true;
        return true;
    }

    void QuantizeTensor(const std::vector<float>& input,
                        std::vector<int8_t>& output,
                        QuantizationParams& params) {
        if (input.empty()) {
            output.clear();
            return;
        }

        params.min_val = *std::min_element(input.begin(), input.end());
        params.max_val = *std::max_element(input.begin(), input.end());

        const float q_min = -127.0f;
        const float q_max = 127.0f;

        params.scale = (params.max_val - params.min_val) / (q_max - q_min);
        if (params.scale < 1e-8f) params.scale = 1e-8f;

        params.zero_point = static_cast<int32_t>(std::round(
            q_min - params.min_val / params.scale));
        params.zero_point = std::max(-128, std::min(127, params.zero_point));

        output.resize(input.size());
        float total_error = 0.0f;

        for (size_t i = 0; i < input.size(); ++i) {
            int32_t q = static_cast<int32_t>(std::round(input[i] / params.scale + params.zero_point));
            q = std::max(-128, std::min(127, q));
            output[i] = static_cast<int8_t>(q);

            float dequantized = (output[i] - params.zero_point) * params.scale;
            total_error += std::abs(input[i] - dequantized);
        }

        quantization_error_ = total_error / input.size();
    }

    void DequantizeTensor(const std::vector<int8_t>& input,
                          std::vector<float>& output,
                          const QuantizationParams& params) {
        output.resize(input.size());
        for (size_t i = 0; i < input.size(); ++i) {
            output[i] = (input[i] - params.zero_point) * params.scale;
        }
    }

    void OptimizeForMobile() {
        num_threads_ = 2;
    }

    void SetNumThreads(int num_threads) {
        num_threads_ = num_threads;
    }

    float GetQuantizationError() const { return quantization_error_; }
    bool IsInitialized() const { return initialized_; }

private:
    bool initialized_;
    std::string model_path_;
    std::vector<float> calibration_data_;
    int num_threads_;
    float quantization_error_;
};

Int8Quantizer::Int8Quantizer() : impl_(std::make_unique<Impl>()) {}
Int8Quantizer::~Int8Quantizer() = default;

bool Int8Quantizer::Initialize(const std::string& model_path,
                               const std::vector<float>& calibration_data) {
    return impl_->Initialize(model_path, calibration_data);
}

void Int8Quantizer::QuantizeTensor(const std::vector<float>& input,
                                   std::vector<int8_t>& output,
                                   QuantizationParams& params) {
    impl_->QuantizeTensor(input, output, params);
}

void Int8Quantizer::DequantizeTensor(const std::vector<int8_t>& input,
                                     std::vector<float>& output,
                                     const QuantizationParams& params) {
    impl_->DequantizeTensor(input, output, params);
}

void Int8Quantizer::OptimizeForMobile() {
    impl_->OptimizeForMobile();
}

void Int8Quantizer::SetNumThreads(int num_threads) {
    impl_->SetNumThreads(num_threads);
}

float Int8Quantizer::GetQuantizationError() const {
    return impl_->GetQuantizationError();
}

bool Int8Quantizer::IsInitialized() const {
    return impl_->IsInitialized();
}

bool ModelOptimizer::QuantizeModel(const std::string& input_model,
                                   const std::string& output_model,
                                   const std::string& calibration_dataset) {
    return true;
}

bool ModelOptimizer::PruneModel(const std::string& input_model,
                                const std::string& output_model,
                                float pruning_ratio) {
    return true;
}

std::vector<QuantizationParams> ModelOptimizer::GetLayerQuantizationParams(
    const std::string& model_path) {
    return {};
}

}
