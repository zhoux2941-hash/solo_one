include_directories(${CMAKE_SOURCE_DIR}/include)

add_executable(virtual_paint virtual_paint.cpp)
target_link_libraries(virtual_paint PRIVATE hand_tracking_sdk)

add_executable(ppt_controller ppt_controller.cpp)
target_link_libraries(ppt_controller PRIVATE hand_tracking_sdk)

add_executable(volume_control volume_control.cpp)
target_link_libraries(volume_control PRIVATE hand_tracking_sdk)

add_executable(hand_tracking_demo demo.cpp)
target_link_libraries(hand_tracking_demo PRIVATE hand_tracking_sdk)
