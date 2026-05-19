#include "hand_tracking_sdk/quantization.h"
#include <iostream>
#include <cassert>
#include <vector>
#include <cmath>

using namespace hand_tracking_sdk;

void TestQuantization() {
    std::cout << "Testing INT8 quantization..." << std::endl;

    Int8Quantizer quantizer;
    assert(quantizer.Initialize("test_model.tflite") == true);
    assert(quantizer.IsInitialized() == true);

    std::vector<float> input = {0.0f, 0.5f, 1.0f, -0.5f, -1.0f, 0.3f, 0.7f, -0.3f};
    std::vector<int8_t> quantized;
    QuantizationParams params;

    quantizer.QuantizeTensor(input, quantized, params);

    std::cout << "  Scale: " << params.scale << std::endl;
    std::cout << "  Zero point: " << params.zero_point << std::endl;
    std::cout << "  Min: " << params.min_val << ", Max: " << params.max_val << std::endl;
    std::cout << "  Quantization error: " << quantizer.GetQuantizationError() << std::endl;

    assert(quantized.size() == input.size());
    assert(params.scale > 0);

    std::vector<float> dequantized;
    quantizer.DequantizeTensor(quantized, dequantized, params);

    float total_error = 0.0f;
    for (size_t i = 0; i < input.size(); ++i) {
        float error = std::abs(input[i] - dequantized[i]);
        total_error += error;
        std::cout << "  [" << i << "] Original: " << input[i]
                  << ", Dequantized: " << dequantized[i]
                  << ", Error: " << error << std::endl;
    }
    std::cout << "  Average error: " << total_error / input.size() << std::endl;

    std::cout << "INT8 quantization tests: PASS" << std::endl;
}

void TestModelOptimizer() {
    std::cout << "Testing ModelOptimizer..." << std::endl;

    bool success = ModelOptimizer::QuantizeModel("input.tflite", "output_int8.tflite", "dataset/");
    assert(success == true);

    success = ModelOptimizer::PruneModel("input.tflite", "output_pruned.tflite", 0.3f);
    assert(success == true);

    auto params = ModelOptimizer::GetLayerQuantizationParams("model.tflite");
    std::cout << "  Layer params count: " << params.size() << std::endl;

    std::cout << "ModelOptimizer tests: PASS" << std::endl;
}

int main() {
    std::cout << "=== Quantization Tests ===" << std::endl;

    TestQuantization();
    TestModelOptimizer();

    std::cout << "\nAll tests passed!" << std::endl;
    return 0;
}
