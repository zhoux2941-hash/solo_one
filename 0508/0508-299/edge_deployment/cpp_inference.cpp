/**
 * C++边缘端推理示例
 * 使用ONNX Runtime C++ API运行导出的仿真环境
 * 
 * 编译依赖:
 * - ONNX Runtime C++库
 * - C++17或更高版本
 * 
 * 编译命令示例 (Linux):
 * g++ -std=c++17 cpp_inference.cpp -o vehicle_inference \
 *     -I/path/to/onnxruntime/include \
 *     -L/path/to/onnxruntime/lib -lonnxruntime
 */

#include <iostream>
#include <vector>
#include <string>
#include <chrono>
#include <cmath>
#include <onnxruntime_cxx_api.h>

class VehicleInference {
public:
    VehicleInference(const std::string& model_path, int intra_op_threads = 1) {
        // 创建ONNX Runtime环境
        env = Ort::Env(ORT_LOGGING_LEVEL_WARNING, "VehicleEnv");
        
        // 创建会话选项（针对边缘设备优化）
        Ort::SessionOptions session_options;
        session_options.SetIntraOpNumThreads(intra_op_threads);
        session_options.SetInterOpNumThreads(1);
        session_options.EnableCpuMemArena();
        
        // 创建会话
        session = Ort::Session(env, model_path.c_str(), session_options);
        
        // 获取输入输出信息
        PrintModelInfo();
    }
    
    void PrintModelInfo() {
        std::cout << "=== 模型信息 ===" << std::endl;
        
        auto input_count = session.GetInputCount();
        auto output_count = session.GetOutputCount();
        
        std::cout << "输入数量: " << input_count << std::endl;
        std::cout << "输出数量: " << output_count << std::endl;
        
        Ort::AllocatorWithDefaultOptions allocator;
        
        for (size_t i = 0; i < input_count; ++i) {
            auto name = session.GetInputNameAllocated(i, allocator);
            auto type_info = session.GetInputTypeInfo(i);
            auto tensor_info = type_info.GetTensorTypeAndShapeInfo();
            auto shape = tensor_info.GetShape();
            
            std::cout << "  输入 " << i << ": " << name.get() << " 形状: [";
            for (size_t j = 0; j < shape.size(); ++j) {
                if (j > 0) std::cout << ", ";
                std::cout << shape[j];
            }
            std::cout << "]" << std::endl;
        }
        
        for (size_t i = 0; i < output_count; ++i) {
            auto name = session.GetOutputNameAllocated(i, allocator);
            std::cout << "  输出 " << i << ": " << name.get() << std::endl;
        }
    }
    
    struct InferenceResult {
        std::vector<float> next_state;
        float reward;
        float done;
        double inference_time_ms;
    };
    
    InferenceResult Step(const std::vector<float>& state, 
                         const std::vector<float>& action, 
                         float t) {
        InferenceResult result;
        
        const int64_t batch_size = 1;
        const int64_t state_dim = 8;
        const int64_t action_dim = 2;
        
        // 准备输入张量
        std::vector<int64_t> state_shape = {batch_size, state_dim};
        std::vector<int64_t> action_shape = {batch_size, action_dim};
        std::vector<int64_t> t_shape = {batch_size, 1};
        
        auto memory_info = Ort::MemoryInfo::CreateCpu(OrtArenaAllocator, OrtMemTypeDefault);
        
        Ort::Value state_tensor = Ort::Value::CreateTensor<float>(
            memory_info,
            const_cast<float*>(state.data()),
            state.size(),
            state_shape.data(),
            state_shape.size()
        );
        
        Ort::Value action_tensor = Ort::Value::CreateTensor<float>(
            memory_info,
            const_cast<float*>(action.data()),
            action.size(),
            action_shape.data(),
            action_shape.size()
        );
        
        std::vector<float> t_data = {t};
        Ort::Value t_tensor = Ort::Value::CreateTensor<float>(
            memory_info,
            t_data.data(),
            t_data.size(),
            t_shape.data(),
            t_shape.size()
        );
        
        // 输入输出名称
        std::vector<const char*> input_names = {"state", "action", "t"};
        std::vector<const char*> output_names = {"next_state", "reward", "done"};
        
        // 计时开始
        auto start = std::chrono::high_resolution_clock::now();
        
        // 运行推理
        std::vector<Ort::Value> output_tensors = session.Run(
            Ort::RunOptions{nullptr},
            input_names.data(),
            std::vector<Ort::Value>{std::move(state_tensor), 
                                     std::move(action_tensor),
                                     std::move(t_tensor)}.data(),
            3,
            output_names.data(),
            3
        );
        
        // 计时结束
        auto end = std::chrono::high_resolution_clock::now();
        result.inference_time_ms = std::chrono::duration<double, std::milli>(end - start).count();
        
        // 获取输出
        float* state_output = output_tensors[0].GetTensorMutableData<float>();
        float* reward_output = output_tensors[1].GetTensorMutableData<float>();
        float* done_output = output_tensors[2].GetTensorMutableData<float>();
        
        result.next_state = std::vector<float>(state_output, state_output + 8);
        result.reward = *reward_output;
        result.done = *done_output;
        
        return result;
    }
    
    void RunBenchmark(int num_steps = 1000) {
        std::cout << "\n=== 性能基准测试 (" << num_steps << " 步) ===" << std::endl;
        
        std::vector<float> state = {0.0, 25.0, 0.0, 0.0, 0.0, 0.0, 50.0, 20.0};
        std::vector<float> action = {0.0, 0.3};
        
        std::vector<double> times;
        times.reserve(num_steps);
        
        for (int i = 0; i < num_steps; ++i) {
            float t = static_cast<float>(i) * 0.01f;
            auto result = Step(state, action, t);
            times.push_back(result.inference_time_ms);
            state = result.next_state;
            
            if (result.done > 0.5f) {
                std::cout << "仿真在第 " << i << " 步终止" << std::endl;
                break;
            }
        }
        
        // 计算统计信息
        double avg_time = 0.0;
        double max_time = 0.0;
        double min_time = 1e9;
        
        for (double t : times) {
            avg_time += t;
            max_time = std::max(max_time, t);
            min_time = std::min(min_time, t);
        }
        avg_time /= times.size();
        
        std::cout << "平均推理时间: " << avg_time << " ms" << std::endl;
        std::cout << "最小推理时间: " << min_time << " ms" << std::endl;
        std::cout << "最大推理时间: " << max_time << " ms" << std::endl;
        std::cout << "推理频率: " << 1000.0 / avg_time << " Hz" << std::endl;
    }
    
    void RunSimulation(int num_steps = 200) {
        std::cout << "\n=== 运行仿真 (" << num_steps << " 步) ===" << std::endl;
        
        std::vector<float> state = {0.0, 25.0, 0.0, 0.0, 0.0, 0.0, 50.0, 20.0};
        
        std::cout << "初始状态:" << std::endl;
        PrintState(state);
        
        double total_time = 0.0;
        
        for (int i = 0; i < num_steps; ++i) {
            // 简单的正弦转向控制
            float steer = 0.1f * std::sin(0.1f * i);
            float throttle = 0.3f;
            std::vector<float> action = {steer, throttle};
            
            float t = static_cast<float>(i) * 0.01f;
            auto result = Step(state, action, t);
            total_time += result.inference_time_ms;
            
            state = result.next_state;
            
            if (i % 20 == 0) {
                std::cout << "\n第 " << i << " 步:" << std::endl;
                std::cout << "  动作: 转向=" << steer << ", 油门=" << throttle << std::endl;
                PrintState(state);
                std::cout << "  奖励: " << result.reward << std::endl;
                std::cout << "  推理时间: " << result.inference_time_ms << " ms" << std::endl;
            }
            
            if (result.done > 0.5f) {
                std::cout << "\n仿真在第 " << i << " 步终止!" << std::endl;
                break;
            }
        }
        
        std::cout << "\n总推理时间: " << total_time << " ms" << std::endl;
        std::cout << "平均每步: " << total_time / num_steps << " ms" << std::endl;
    }
    
private:
    void PrintState(const std::vector<float>& state) {
        std::cout << "  位置: (" << state[0] << ", " << state[4] << ")" << std::endl;
        std::cout << "  速度: " << state[1] << " m/s" << std::endl;
        std::cout << "  航向角: " << state[2] << " rad" << std::endl;
        std::cout << "  前轮转角: " << state[3] << " rad" << std::endl;
        std::cout << "  前车位置: " << state[6] << " m" << std::endl;
    }
    
    Ort::Env env{nullptr};
    Ort::Session session{nullptr};
};

int main(int argc, char* argv[]) {
    std::cout << "========================================" << std::endl;
    std::cout << "  C++ 边缘端推理示例" << std::endl;
    std::cout << "  自动驾驶超车仿真环境" << std::endl;
    std::cout << "========================================" << std::endl;
    
    std::string model_path = "../onnx_models/vehicle_env_euler.onnx";
    if (argc > 1) {
        model_path = argv[1];
    }
    
    std::cout << "\n加载模型: " << model_path << std::endl;
    
    try {
        VehicleInference inference(model_path, 1);
        
        // 运行仿真
        inference.RunSimulation(200);
        
        // 运行基准测试
        inference.RunBenchmark(1000);
        
        std::cout << "\n推理完成!" << std::endl;
        
    } catch (const Ort::Exception& e) {
        std::cerr << "ONNX Runtime 错误: " << e.what() << std::endl;
        return 1;
    } catch (const std::exception& e) {
        std::cerr << "错误: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}
