// SPDX-License-Identifier: BSD-3-Clause
#pragma once
#include <stddef.h>

void storage_files(void);
void storage_save(const char *name, const char *program, size_t size);
int storage_load(const char *name, char *program, size_t capacity);
