#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <pybind11/numpy.h>
#include <pybind11/chrono.h>
#include "hand_tracking_sdk/hand_tracker.h"
#include "hand_tracking_sdk/gesture_recognizer.h"
#include "hand_tracking_sdk/visualizer.h"
#include "hand_tracking_sdk/performance_optimizer.h"
#include "hand_tracking_sdk/quantization.h"
#include "hand_tracking_sdk/multi_user_tracker.h"
#include <opencv2/opencv.hpp>

namespace py = pybind11;
using namespace hand_tracking_sdk;

cv::Mat numpy_to_mat(py::array_t<unsigned char>& input) {
    py::buffer_info buf = input.request();
    if (buf.ndim != 3) throw std::runtime_error("Expected 3D array");
    int height = buf.shape[0];
    int width = buf.shape[1];
    int channels = buf.shape[2];
    return cv::Mat(height, width, CV_8UC(channels), (unsigned char*)buf.ptr);
}

py::array_t<unsigned char> mat_to_numpy(const cv::Mat& mat) {
    py::array_t<unsigned char> result({mat.rows, mat.cols, mat.channels()});
    py::buffer_info buf = result.request();
    unsigned char* ptr = static_cast<unsigned char*>(buf.ptr);
    std::memcpy(ptr, mat.data, mat.total() * mat.elemSize());
    return result;
}

PYBIND11_MODULE(py_hand_tracking_sdk, m) {
    m.doc() = "MediaPipe Hand Tracking SDK Python Bindings";

    py::class_<Point3D>(m, "Point3D")
        .def(py::init<>())
        .def(py::init<float, float, float>())
        .def_readwrite("x", &Point3D::x)
        .def_readwrite("y", &Point3D::y)
        .def_readwrite("z", &Point3D::z)
        .def("__repr__", [](const Point3D& p) {
            return "Point3D(" + std::to_string(p.x) + ", " + std::to_string(p.y) + ", " + std::to_string(p.z) + ")";
        });

    py::class_<Landmark>(m, "Landmark")
        .def(py::init<>())
        .def_readwrite("position", &Landmark::position)
        .def_readwrite("visibility", &Landmark::visibility)
        .def_readwrite("presence", &Landmark::presence);

    py::enum_<GestureType>(m, "GestureType")
        .value("NONE", GestureType::NONE)
        .value("FIST", GestureType::FIST)
        .value("ONE", GestureType::ONE)
        .value("TWO", GestureType::TWO)
        .value("THREE", GestureType::THREE)
        .value("FOUR", GestureType::FOUR)
        .value("FIVE", GestureType::FIVE)
        .value("OK", GestureType::OK)
        .value("THUMBS_UP", GestureType::THUMBS_UP)
        .value("HEART", GestureType::HEART)
        .export_values();

    py::class_<GestureResult>(m, "GestureResult")
        .def(py::init<>())
        .def_readwrite("type", &GestureResult::type)
        .def_readwrite("confidence", &GestureResult::confidence)
        .def_readwrite("name", &GestureResult::name);

    py::class_<HandResult>(m, "HandResult")
        .def(py::init<>())
        .def_readwrite("landmarks", &HandResult::landmarks)
        .def_readwrite("world_landmarks", &HandResult::world_landmarks)
        .def_readwrite("gesture", &HandResult::gesture)
        .def_readwrite("is_left_hand", &HandResult::is_left_hand)
        .def_readwrite("hand_score", &HandResult::hand_score)
        .def_readwrite("bounding_box", &HandResult::bounding_box);

    py::class_<FrameResult>(m, "FrameResult")
        .def(py::init<>())
        .def_readwrite("hands", &FrameResult::hands)
        .def_readwrite("timestamp_ms", &FrameResult::timestamp_ms)
        .def_readwrite("inference_time_ms", &FrameResult::inference_time_ms)
        .def_readwrite("width", &FrameResult::width)
        .def_readwrite("height", &FrameResult::height);

    py::enum_<TrackingMode>(m, "TrackingMode")
        .value("SINGLE_HAND", TrackingMode::SINGLE_HAND)
        .value("MULTI_HAND", TrackingMode::MULTI_HAND)
        .export_values();

    py::class_<TrackerConfig>(m, "TrackerConfig")
        .def(py::init<>())
        .def_readwrite("mode", &TrackerConfig::mode)
        .def_readwrite("max_num_hands", &TrackerConfig::max_num_hands)
        .def_readwrite("min_detection_confidence", &TrackerConfig::min_detection_confidence)
        .def_readwrite("min_tracking_confidence", &TrackerConfig::min_tracking_confidence)
        .def_readwrite("enable_gesture_recognition", &TrackerConfig::enable_gesture_recognition)
        .def_readwrite("use_int8_quantization", &TrackerConfig::use_int8_quantization)
        .def_readwrite("model_path", &TrackerConfig::model_path);

    py::class_<HandTracker>(m, "HandTracker")
        .def(py::init<>())
        .def("initialize", &HandTracker::Initialize)
        .def("process_frame", [](HandTracker& self, py::array_t<unsigned char> frame_arr) {
            cv::Mat frame = numpy_to_mat(frame_arr);
            FrameResult result;
            bool success = self.ProcessFrame(frame, result);
            return std::make_pair(success, result);
        })
        .def("process_frame_async", [](HandTracker& self, py::array_t<unsigned char> frame_arr) {
            cv::Mat frame = numpy_to_mat(frame_arr);
            return self.ProcessFrameAsync(frame);
        })
        .def("get_latest_result", &HandTracker::GetLatestResult)
        .def("release", &HandTracker::Release)
        .def("is_initialized", &HandTracker::IsInitialized)
        .def("get_config", &HandTracker::GetConfig)
        .def_static("get_sdk_version", &HandTracker::GetSDKVersion);

    py::class_<GestureRecognizer>(m, "GestureRecognizer")
        .def(py::init<>())
        .def("initialize", &GestureRecognizer::Initialize)
        .def("recognize", &GestureRecognizer::Recognize)
        .def("release", &GestureRecognizer::Release)
        .def_static("get_supported_gestures", &GestureRecognizer::GetSupportedGestures)
        .def_static("calculate_similarity", &GestureRecognizer::CalculateSimilarity);

    py::class_<Visualizer>(m, "Visualizer")
        .def(py::init<>())
        .def("draw_landmarks", [](Visualizer& self, py::array_t<unsigned char> img_arr,
                                  const HandResult& hand) {
            cv::Mat img = numpy_to_mat(img_arr);
            self.DrawLandmarks(img, hand);
            return mat_to_numpy(img);
        })
        .def("draw_bounding_box", [](Visualizer& self, py::array_t<unsigned char> img_arr,
                                     const HandResult& hand) {
            cv::Mat img = numpy_to_mat(img_arr);
            self.DrawBoundingBox(img, hand);
            return mat_to_numpy(img);
        })
        .def("draw_gesture_label", [](Visualizer& self, py::array_t<unsigned char> img_arr,
                                      const HandResult& hand) {
            cv::Mat img = numpy_to_mat(img_arr);
            self.DrawGestureLabel(img, hand);
            return mat_to_numpy(img);
        })
        .def("draw_fps", [](Visualizer& self, py::array_t<unsigned char> img_arr, float fps) {
            cv::Mat img = numpy_to_mat(img_arr);
            self.DrawFPS(img, fps);
            return mat_to_numpy(img);
        })
        .def("draw_all", [](Visualizer& self, py::array_t<unsigned char> img_arr,
                            const FrameResult& result, float fps = 0.0f) {
            cv::Mat img = numpy_to_mat(img_arr);
            self.DrawAll(img, result, fps);
            return mat_to_numpy(img);
        })
        .def_static("get_hand_connections", &Visualizer::GetHandConnections);

    py::class_<PerformanceProfiler>(m, "PerformanceProfiler")
        .def(py::init<>())
        .def("start_frame", &PerformanceProfiler::StartFrame)
        .def("end_frame", &PerformanceProfiler::EndFrame)
        .def("get_fps", &PerformanceProfiler::GetFPS)
        .def("get_average_inference_time", &PerformanceProfiler::GetAverageInferenceTime)
        .def("get_last_inference_time", &PerformanceProfiler::GetLastInferenceTime)
        .def("reset", &PerformanceProfiler::Reset);

    py::class_<FrameSkipper>(m, "FrameSkipper")
        .def(py::init<int>())
        .def("should_process_frame", &FrameSkipper::ShouldProcessFrame)
        .def("set_target_fps", &FrameSkipper::SetTargetFPS)
        .def("get_target_fps", &FrameSkipper::GetTargetFPS);

    py::class_<LowPassFilter>(m, "LowPassFilter")
        .def(py::init<float>())
        .def("filter", &LowPassFilter::Filter)
        .def("reset", &LowPassFilter::Reset)
        .def("set_alpha", &LowPassFilter::SetAlpha);

    py::class_<QuantizationParams>(m, "QuantizationParams")
        .def(py::init<>())
        .def_readwrite("scale", &QuantizationParams::scale)
        .def_readwrite("zero_point", &QuantizationParams::zero_point)
        .def_readwrite("min_val", &QuantizationParams::min_val)
        .def_readwrite("max_val", &QuantizationParams::max_val);

    py::class_<Int8Quantizer>(m, "Int8Quantizer")
        .def(py::init<>())
        .def("initialize", &Int8Quantizer::Initialize)
        .def("quantize_tensor", [](Int8Quantizer& self, const std::vector<float>& input) {
            std::vector<int8_t> output;
            QuantizationParams params;
            self.QuantizeTensor(input, output, params);
            return std::make_pair(output, params);
        })
        .def("dequantize_tensor", &Int8Quantizer::DequantizeTensor)
        .def("optimize_for_mobile", &Int8Quantizer::OptimizeForMobile)
        .def("set_num_threads", &Int8Quantizer::SetNumThreads)
        .def("get_quantization_error", &Int8Quantizer::GetQuantizationError)
        .def("is_initialized", &Int8Quantizer::IsInitialized);

    py::class_<KalmanFilter1D>(m, "KalmanFilter1D")
        .def(py::init<float, float, float>(),
             py::arg("process_noise") = 0.01f,
             py::arg("measurement_noise") = 0.1f,
             py::arg("estimation_error") = 1.0f)
        .def("filter", &KalmanFilter1D::Filter)
        .def("reset", &KalmanFilter1D::Reset)
        .def("set_process_noise", &KalmanFilter1D::SetProcessNoise)
        .def("set_measurement_noise", &KalmanFilter1D::SetMeasurementNoise);

    py::class_<KalmanFilter3D>(m, "KalmanFilter3D")
        .def(py::init<float, float>(),
             py::arg("process_noise") = 0.01f,
             py::arg("measurement_noise") = 0.1f)
        .def("filter", &KalmanFilter3D::Filter)
        .def("reset", &KalmanFilter3D::Reset,
             py::arg("initial_value") = Point3D(0, 0, 0))
        .def("set_process_noise", &KalmanFilter3D::SetProcessNoise)
        .def("set_measurement_noise", &KalmanFilter3D::SetMeasurementNoise);

    py::class_<OneEuroFilter>(m, "OneEuroFilter")
        .def(py::init<float, float, float>(),
             py::arg("min_cutoff") = 1.0f,
             py::arg("beta") = 0.007f,
             py::arg("d_cutoff") = 1.0f)
        .def("filter", &OneEuroFilter::Filter)
        .def("reset", &OneEuroFilter::Reset)
        .def("set_parameters", &OneEuroFilter::SetParameters);

    py::class_<HandSmoother>(m, "HandSmoother")
        .def(py::init<HandSmoother::SmoothMode>(),
             py::arg("mode") = HandSmoother::SmoothMode::ONE_EURO)
        .def("smooth", &HandSmoother::Smooth)
        .def("reset", &HandSmoother::Reset)
        .def("set_mode", &HandSmoother::SetMode)
        .def("set_smooth_strength", &HandSmoother::SetSmoothStrength);

    py::enum_<HandSmoother::SmoothMode>(m, "SmoothMode")
        .value("LOW_PASS", HandSmoother::SmoothMode::LOW_PASS)
        .value("KALMAN", HandSmoother::SmoothMode::KALMAN)
        .value("ONE_EURO", HandSmoother::SmoothMode::ONE_EURO)
        .export_values();

    py::class_<OutlierDetector>(m, "OutlierDetector")
        .def(py::init<float, size_t>(),
             py::arg("threshold") = 3.0f,
             py::arg("window_size") = 10)
        .def("is_outlier", &OutlierDetector::IsOutlier)
        .def("get_smoothed_point", &OutlierDetector::GetSmoothedPoint)
        .def("reset", &OutlierDetector::Reset)
        .def("set_threshold", &OutlierDetector::SetThreshold);

    py::class_<TemporalGestureSmoother>(m, "TemporalGestureSmoother")
        .def(py::init<size_t, float>(),
             py::arg("window_size") = 8,
             py::arg("min_consistency") = 0.6f)
        .def("smooth", &TemporalGestureSmoother::Smooth)
        .def("reset", &TemporalGestureSmoother::Reset)
        .def("set_window_size", &TemporalGestureSmoother::SetWindowSize)
        .def("set_min_consistency", &TemporalGestureSmoother::SetMinConsistency)
        .def("get_stable_gesture", &TemporalGestureSmoother::GetStableGesture);

    py::class_<MotionAnalyzer>(m, "MotionAnalyzer")
        .def(py::init<>())
        .def("analyze", &MotionAnalyzer::Analyze)
        .def("reset", &MotionAnalyzer::Reset)
        .def("get_adaptive_smooth_alpha", &MotionAnalyzer::GetAdaptiveSmoothAlpha)
        .def("get_current_speed", &MotionAnalyzer::GetCurrentSpeed);

    py::class_<MotionAnalyzer::MotionInfo>(m, "MotionInfo")
        .def(py::init<>())
        .def_readwrite("speed", &MotionAnalyzer::MotionInfo::speed)
        .def_readwrite("acceleration", &MotionAnalyzer::MotionInfo::acceleration)
        .def_readwrite("direction_change", &MotionAnalyzer::MotionInfo::direction_change)
        .def_readwrite("is_fast_motion", &MotionAnalyzer::MotionInfo::is_fast_motion)
        .def_readwrite("is_stable", &MotionAnalyzer::MotionInfo::is_stable);

    py::class_<QualityEstimator>(m, "QualityEstimator")
        .def(py::init<>())
        .def("estimate", &QualityEstimator::Estimate)
        .def("reset", &QualityEstimator::Reset);

    py::class_<QualityEstimator::QualityInfo>(m, "QualityInfo")
        .def(py::init<>())
        .def_readwrite("overall_quality", &QualityEstimator::QualityInfo::overall_quality)
        .def_readwrite("visibility_score", &QualityEstimator::QualityInfo::visibility_score)
        .def_readwrite("position_score", &QualityEstimator::QualityInfo::position_score)
        .def_readwrite("size_score", &QualityEstimator::QualityInfo::size_score)
        .def_readwrite("is_low_quality", &QualityEstimator::QualityInfo::is_low_quality);

    py::class_<HandFeatures>(m, "HandFeatures")
        .def(py::init<>())
        .def_readwrite("palm_size", &HandFeatures::palm_size)
        .def_readwrite("aspect_ratio", &HandFeatures::aspect_ratio)
        .def_readwrite("finger_length_ratio", &HandFeatures::finger_length_ratio)
        .def_readwrite("palm_center", &HandFeatures::palm_center)
        .def_readwrite("orientation", &HandFeatures::orientation)
        .def_readwrite("finger_angles", &HandFeatures::finger_angles);

    py::class_<UserInfo>(m, "UserInfo")
        .def(py::init<>())
        .def_readwrite("user_id", &UserInfo::user_id)
        .def_readwrite("name", &UserInfo::name)
        .def_readwrite("hand_ids", &UserInfo::hand_ids)
        .def_readwrite("first_seen_ms", &UserInfo::first_seen_ms)
        .def_readwrite("last_seen_ms", &UserInfo::last_seen_ms)
        .def_readwrite("is_active", &UserInfo::is_active)
        .def_readwrite("num_hands", &UserInfo::num_hands);

    py::class_<HandFeatureExtractor>(m, "HandFeatureExtractor")
        .def(py::init<>())
        .def_static("extract", &HandFeatureExtractor::Extract)
        .def_static("calculate_similarity", &HandFeatureExtractor::CalculateSimilarity)
        .def_static("calculate_bounding_box_overlap", &HandFeatureExtractor::CalculateBoundingBoxOverlap)
        .def_static("calculate_palm_center", &HandFeatureExtractor::CalculatePalmCenter)
        .def_static("calculate_palm_size", &HandFeatureExtractor::CalculatePalmSize);

    py::class_<MultiUserTracker>(m, "MultiUserTracker")
        .def(py::init<>())
        .def("initialize", &MultiUserTracker::Initialize)
        .def("assign_hands_to_users", &MultiUserTracker::AssignHandsToUsers)
        .def("get_active_user_count", &MultiUserTracker::GetActiveUserCount)
        .def("get_active_hand_count", &MultiUserTracker::GetActiveHandCount)
        .def("reset", &MultiUserTracker::Reset)
        .def("release", &MultiUserTracker::Release)
        .def("get_users", &MultiUserTracker::GetUsers);

    py::enum_<TrackingMode>(m, "TrackingMode")
        .value("SINGLE_HAND", TrackingMode::SINGLE_HAND)
        .value("MULTI_HAND", TrackingMode::MULTI_HAND)
        .value("MULTI_USER", TrackingMode::MULTI_USER)
        .export_values();

    m.def("gesture_type_to_string", &GestureTypeToString);
    m.def("string_to_gesture_type", &StringToGestureType);
}
