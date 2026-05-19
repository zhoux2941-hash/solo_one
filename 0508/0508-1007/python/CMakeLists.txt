find_package(pybind11 REQUIRED)

pybind11_add_module(py_hand_tracking_sdk bindings.cpp)

target_link_libraries(py_hand_tracking_sdk PRIVATE hand_tracking_sdk)

set_target_properties(py_hand_tracking_sdk PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/python"
)
