// SPDX-License-Identifier: BSD-3-Clause
#include <setjmp.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "pico/stdlib.h"
#include "piccoloBASIC.h"
#include "ubasic.h"
#include "storage.h"

static char program[PROG_BUFFER_SIZE];
static jmp_buf interpreter_exit;
static bool running;

void piccolo_abort(void) {
    longjmp(interpreter_exit, 1);
}

int check_if_should_enter_CMD_mode(void) {
    if (running && getchar_timeout_us(0) == 3) {
        puts("Stopped");
        piccolo_abort();
    }
    return 0;
}

// Also handle explicit exit() calls from the upstream parser.
void __wrap_exit(int status) {
    printf("Interpreter exited (%d)\n", status);
    piccolo_abort();
}

static void run_program(void) {
    running = true;
    if (setjmp(interpreter_exit) == 0) {
        ubasic_init(program);
        while (!ubasic_finished()) {
            ubasic_run();
        }
    }
    running = false;
}

int main(void) {
    stdio_init_all();
    puts("PiccoloBASIC UART");
    char line[242];
    size_t used = 0;
    size_t length = 0;
    bool overflow = false;
    bool last_cr = false;
    fputs(">", stdout);
    fflush(stdout);
    while (true) {
        const int key = getchar();
        if (key < 0) continue;
        if (key == '\n' && last_cr) {
            last_cr = false;
            continue;
        }
        last_cr = key == '\r';
        if (key == '\r' || key == '\n') {
            line[length] = '\0';
            putchar('\n');
            if (overflow) {
                puts("Line too long");
            } else if (!strcmp(line, "RUN")) {
                if (used) run_program();
            } else if (!strcmp(line, "NEW")) {
                used = 0;
                program[0] = '\0';
            } else if (!strcmp(line, "LIST")) {
                fputs(program, stdout);
            } else if (!strcmp(line, "FILES")) {
                storage_files();
            } else if (!strncmp(line, "SAVE ", 5)) {
                storage_save(line + 5, program, used);
            } else if (!strncmp(line, "LOAD ", 5)) {
                int size = storage_load(line + 5, program, sizeof(program));
                if (size >= 0) used = (size_t)size;
            } else if (length) {
                if (used + length + 1 >= sizeof(program)) {
                    puts("Program too long");
                } else {
                    memcpy(program + used, line, length);
                    used += length;
                    program[used++] = '\n';
                    program[used] = '\0';
                }
            }
            fputs(">", stdout);
            fflush(stdout);
            length = 0;
            overflow = false;
        } else if (key == 0x7f || key == '\b') {
            if (length) {
                --length;
                fputs("\b \b", stdout);
            }
        } else if (key >= ' ' && key <= '~') {
            if (length < sizeof(line) - 1) {
                line[length++] = (char)key;
                putchar(key);
            } else {
                overflow = true;
            }
        }
    }
}
