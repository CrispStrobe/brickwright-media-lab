/*
 * zForth on DOS — a tiny embeddable Forth (zevv/zForth, MIT) wrapped as a
 * self-contained 16-bit MS-DOS program for the bw-board 8086 DOS bench.
 *
 * The standard zForth Forth bootstrap (core/dict/memaccess/misc .zf) is embedded
 * as a C string (bootstrap.inc) and evaluated at startup, so the program needs
 * no extra mounted files. It then reads the user's program from PROG.FTH via the
 * C library (INT 21h) and evaluates it — the same PROG.<X> contract fe/partcl
 * use. Output is plain stdout. No readline, no REPL: a run-a-file interpreter.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include "zforth.h"
#include "bootstrap.inc"

zf_input_state zf_host_sys(zf_ctx *ctx, zf_syscall_id id, const char *input)
{
    switch ((int)id) {
        case ZF_SYSCALL_EMIT:
            putchar((char)zf_pop(ctx));
            break;
        case ZF_SYSCALL_PRINT:
            printf(ZF_CELL_FMT " ", zf_pop(ctx));
            break;
        case ZF_SYSCALL_TELL: {
            zf_cell len = zf_pop(ctx);
            zf_cell addr = zf_pop(ctx);
            void *buf = (unsigned char *)zf_dump(ctx, NULL) + (int)addr;
            fwrite(buf, 1, (int)len, stdout);
            break;
        }
        case ZF_SYSCALL_USER + 0:   /* bye */
            printf("\n");
            exit(0);
            break;
        case ZF_SYSCALL_USER + 1:   /* sin, kept for parity with the stock lib */
            zf_push(ctx, (zf_cell)sin(zf_pop(ctx)));
            break;
        default:
            break;
    }
    (void)input;
    return ZF_INPUT_INTERPRET;
}

void zf_host_trace(zf_ctx *ctx, const char *fmt, va_list va)
{
    (void)ctx; (void)fmt; (void)va;
}

zf_cell zf_host_parse_num(zf_ctx *ctx, const char *buf)
{
    zf_cell v;
    int n = 0;
    int r = sscanf(buf, ZF_SCAN_FMT "%n", &v, &n);
    if (r != 1 || buf[n] != '\0') {
        zf_abort(ctx, ZF_ABORT_NOT_A_WORD);
    }
    return v;
}

/* Evaluate a whole buffer line by line (zf_eval consumes a line at a time, the
 * way the stock include() feeds it). */
static void eval_lines(zf_ctx *ctx, const char *s)
{
    char line[256];
    size_t i = 0;
    while (*s) {
        char c = *s++;
        if (c == '\n' || i == sizeof(line) - 1) {
            line[i] = '\0';
            if (i) zf_eval(ctx, line);
            i = 0;
        } else if (c != '\r') {
            line[i++] = c;
        }
    }
    if (i) { line[i] = '\0'; zf_eval(ctx, line); }
}

static void include_file(zf_ctx *ctx, const char *fname)
{
    char buf[256];
    FILE *f = fopen(fname, "rb");
    if (!f) { printf("cannot open %s\n", fname); return; }
    while (fgets(buf, sizeof(buf), f)) zf_eval(ctx, buf);
    fclose(f);
}

int main(void)
{
    static zf_ctx ctx;   /* static: the DOS near heap is small */
    zf_init(&ctx, 0);
    zf_bootstrap(&ctx);
    eval_lines(&ctx, BOOTSTRAP);
    printf("zForth on DOS (8086)\n");
    include_file(&ctx, "PROG.FTH");
    return 0;
}
