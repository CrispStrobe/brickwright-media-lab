// SPDX-License-Identifier: BSD-3-Clause
#include <stdbool.h>
#include <stdio.h>
#include <string.h>

#include "pico/stdlib.h"
#include "lfs.h"
#include "piccoloBASIC.h"
#include "storage.h"

extern const struct lfs_config lfswrapper_cfg;
extern char __flash_binary_end;
static lfs_t fs;
static bool mounted;
static const char temporary[] = ".save-tmp";

static bool mount_storage(void) {
    if (mounted) return true;
    const uint8_t *flash = (const uint8_t *)(XIP_BASE + PICCOLOBASIC_HW_FLASH_STORAGE_BASE);
    if ((uintptr_t)&__flash_binary_end > (uintptr_t)flash) {
        puts("Firmware overlaps LittleFS");
        return false;
    }
    if (lfs_mount(&fs, &lfswrapper_cfg) == 0) {
        mounted = true;
        return true;
    }
    for (size_t i = 0; i < PICCOLOBASIC_HW_FLASH_STORAGE_BYTES; ++i) {
        if (flash[i] != 0xff) {
            puts("LittleFS could not mount");
            return false;
        }
    }
    mounted = lfs_format(&fs, &lfswrapper_cfg) == 0 && lfs_mount(&fs, &lfswrapper_cfg) == 0;
    if (!mounted) puts("LittleFS initialization failed");
    return mounted;
}

static bool filename(const char *argument, char name[64]) {
    if (*argument++ == '"') {
        size_t length = strspn(argument, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-. ");
        if (length && length < 64 && argument[0] != '.' && argument[length] == '"' && !argument[length + 1]) {
            memcpy(name, argument, length);
            name[length] = '\0';
            return true;
        }
    }
    puts("Use a quoted filename of 1 to 63 letters, digits, spaces, dots, dashes or underscores");
    return false;
}

void storage_files(void) {
    if (!mount_storage()) return;
    lfs_dir_t dir;
    if (lfs_dir_open(&fs, &dir, "/") < 0) {
        puts("Could not list files");
        return;
    }
    struct lfs_info info;
    int status;
    while ((status = lfs_dir_read(&fs, &dir, &info)) > 0) {
        if (info.type == LFS_TYPE_REG && strcmp(info.name, temporary)) puts(info.name);
    }
    if (lfs_dir_close(&fs, &dir) < 0 || status < 0) puts("Could not list files");
}

void storage_save(const char *argument, const char *program, size_t size) {
    char name[64];
    if (!filename(argument, name) || !mount_storage()) return;
    lfs_file_t file;
    if (lfs_file_open(&fs, &file, temporary, LFS_O_WRONLY | LFS_O_CREAT | LFS_O_TRUNC) < 0) {
        puts("Could not save file");
        return;
    }
    lfs_ssize_t written = lfs_file_write(&fs, &file, program, size);
    int closed = lfs_file_close(&fs, &file);
    if (written != (lfs_ssize_t)size || closed < 0 || lfs_rename(&fs, temporary, name) < 0) {
        lfs_remove(&fs, temporary);
        puts("Could not save file");
        return;
    }
    printf("Saved %s\n", name);
}

int storage_load(const char *argument, char *program, size_t capacity) {
    char name[64];
    if (!filename(argument, name) || !mount_storage()) return -1;
    lfs_file_t file;
    if (lfs_file_open(&fs, &file, name, LFS_O_RDONLY) < 0) {
        puts("Could not open file");
        return -1;
    }
    static char loaded[PROG_BUFFER_SIZE];
    lfs_soff_t size = lfs_file_size(&fs, &file);
    if (size < 0 || size >= (lfs_soff_t)capacity || size >= (lfs_soff_t)sizeof(loaded)) {
        lfs_file_close(&fs, &file);
        puts("Could not load file or program too long");
        return -1;
    }
    lfs_ssize_t count = lfs_file_read(&fs, &file, loaded, size);
    if (lfs_file_close(&fs, &file) < 0 || count != size || memchr(loaded, '\0', size)) {
        puts("Could not load file");
        return -1;
    }
    memcpy(program, loaded, size);
    program[size] = '\0';
    printf("Loaded %s\n", name);
    return size;
}
