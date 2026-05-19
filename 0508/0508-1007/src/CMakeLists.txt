set(SOURCES
    common.cpp
    hand_tracker.cpp
    gesture_recognizer.cpp
    visualizer.cpp
    performance_optimizer.cpp
    quantization.cpp
    multi_user_tracker.cpp
)

add_library(hand_tracking_sdk STATIC ${SOURCES})

target_include_directories(hand_tracking_sdk PUBLIC
    ${CMAKE_SOURCE_DIR}/include
)

find_package(OpenCV REQUIRED)
target_link_libraries(hand_tracking_sdk PUBLIC ${OpenCV_LIBS})

if(USE_INT8_QUANTIZATION)
    target_compile_definitions(hand_tracking_sdk PRIVATE USE_INT8_QUANTIZATION)
endif()

if(WIN32)
    target_compile_definitions(hand_tracking_sdk PRIVATE _WIN32)
elseif(ANDROID)
    target_compile_definitions(hand_tracking_sdk PRIVATE ANDROID)
elseif(APPLE)
    target_compile_definitions(hand_tracking_sdk PRIVATE APPLE)
endif()

set_target_properties(hand_tracking_sdk PROPERTIES
    VERSION ${PROJECT_VERSION}
    SOVERSION 1
)
