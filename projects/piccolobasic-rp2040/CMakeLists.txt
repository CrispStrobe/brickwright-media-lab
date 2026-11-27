cmake_minimum_required(VERSION 3.13)
include("$ENV{PICO_SDK_PATH}/external/pico_sdk_import.cmake")
project(piccolobasic_uart C CXX ASM)
pico_sdk_init()
set(CMAKE_C_STANDARD 11)
add_executable(piccolobasic_uart
    monitor.c storage.c "${PICCOLO_SOURCE}/ubasic.c" "${PICCOLO_SOURCE}/tokenizer.c"
    "${PICCOLO_SOURCE}/lfs.c" "${PICCOLO_SOURCE}/lfs_util.c" "${PICCOLO_SOURCE}/lfs_wrapper.c")
target_compile_definitions(piccolobasic_uart PRIVATE LFS_NO_ERROR
    PICCOLOBASIC_HW_FLASH_STORAGE_BASE=0xA0000 PICCOLOBASIC_HW_FLASH_STORAGE_BYTES=0x20000)
target_include_directories(piccolobasic_uart PRIVATE "${PICCOLO_SOURCE}")
# LittleFS reports its source filename in warnings. Keep it independent of the build path.
target_compile_options(piccolobasic_uart PRIVATE "-ffile-prefix-map=${PICCOLO_SOURCE}=piccolobasic")
target_link_libraries(piccolobasic_uart pico_stdlib hardware_flash)
pico_enable_stdio_usb(piccolobasic_uart 0)
pico_enable_stdio_uart(piccolobasic_uart 1)
target_link_options(piccolobasic_uart PRIVATE -Wl,--wrap=exit)
