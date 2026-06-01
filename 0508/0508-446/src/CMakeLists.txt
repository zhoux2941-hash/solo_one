set(COMMON_SOURCES
    common/types.cpp
)

set(CORE_SOURCES
    ${COMMON_SOURCES}
)

set(PCAP_SOURCES
    ${COMMON_SOURCES}
)

set(STATS_SOURCES
    ${COMMON_SOURCES}
)

add_library(wps_core INTERFACE)
target_include_directories(wps_core INTERFACE
    $<BUILD_INTERFACE:${CMAKE_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include/wireshark_plugin_suite>
)
target_link_libraries(wps_core INTERFACE Threads::Threads)

add_library(wps_pcap INTERFACE)
target_include_directories(wps_pcap INTERFACE
    $<BUILD_INTERFACE:${CMAKE_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include/wireshark_plugin_suite>
)
target_link_libraries(wps_pcap INTERFACE wps_core Threads::Threads)

add_library(wps_stats INTERFACE)
target_include_directories(wps_stats INTERFACE
    $<BUILD_INTERFACE:${CMAKE_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include/wireshark_plugin_suite>
)
target_link_libraries(wps_stats INTERFACE wps_core Threads::Threads)

add_library(wireshark_plugin_suite SHARED
    ${COMMON_SOURCES}
)

target_link_libraries(wireshark_plugin_suite PUBLIC Threads::Threads)
target_include_directories(wireshark_plugin_suite PUBLIC
    $<BUILD_INTERFACE:${CMAKE_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include/wireshark_plugin_suite>
)

set_target_properties(wireshark_plugin_suite PROPERTIES
    VERSION ${PROJECT_VERSION}
    SOVERSION ${PROJECT_VERSION_MAJOR}
)

install(TARGETS wireshark_plugin_suite wps_core wps_pcap wps_stats
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
    RUNTIME DESTINATION bin
)

install(DIRECTORY ${CMAKE_SOURCE_DIR}/include/
    DESTINATION include/wireshark_plugin_suite
    FILES_MATCHING PATTERN "*.h"
)
