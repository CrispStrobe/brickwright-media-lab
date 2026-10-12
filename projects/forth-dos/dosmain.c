/*
 * zForth on DOS — a tiny embeddable Forth (zevv/zForth, MIT) wrapped as a
 * self-contained 16-bit MS-DOS program for the bw-board 8086 DOS bench.
 *
 * The standard zForth Forth bootstrap (core.zf) is embedded as a C string
 * (bootstrap.inc) and evaluated at startup, so the program needs no extra
 * mounted files. It then reads the user's program from PROG.FTH via the C
 * library (INT 21h) and evaluates it — the same PROG.<X> contract fe/partcl
 * use. Output is plain stdout. No readline, no REPL: a run-a-file interpreter.
 *
 * GPIO bridge (the "drive the board" extension point). Two prelude words drive
 * the machine's I/O ports, so a *generated* Forth word can reach a device:
 *   pin! ( pin value -- )  does an 8086 OUT to BW_GPIO_BASE+pin
 *   pin@ ( pin -- value )  does an 8086 IN  from BW_GPIO_BASE+pin
 * They are plain user syscalls (`132 sys` / `133 sys`) and are inert unless a
 * program calls them, so every existing Forth program behaves identically.
 * The bw-board 8086 bench fires machine.hooks.onPortAccess on every OUT/IN, so
 * brickwright-lite maps a port write onto a device register (an 8-pin GPIO
 * strip widget). See docs/CODE-TAB-LANGUAGE-DEVICE-BRIDGE.md in brickwright-lite.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include "zforth.h"
#include "bootstrap.inc"

#define BW_GPIO_BASE 0x0378   /* classic LPT1 data-port base; 8 pins 0x378..0x37f */

static void bw_outb(unsigned port, unsigned char v)
{
    __asm__ volatile ("outb %b0, %w1" : : "a"(v), "d"((unsigned short)port));
}
static unsigned char bw_inb(unsigned port)
{
    unsigned char v;
    __asm__ volatile ("inb %w1, %b0" : "=a"(v) : "d"((unsigned short)port));
    return v;
}

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
        case ZF_SYSCALL_USER + 4: { /* pin!  ( pin value -- ) OUT to BW_GPIO_BASE+pin */
            int value = (int)zf_pop(ctx);
            int pin = (int)zf_pop(ctx);
            bw_outb(BW_GPIO_BASE + (pin & 7), (unsigned char)value);
            break;
        }
        case ZF_SYSCALL_USER + 5: { /* pin@  ( pin -- value ) IN from BW_GPIO_BASE+pin */
            int pin = (int)zf_pop(ctx);
            zf_push(ctx, (zf_cell)bw_inb(BW_GPIO_BASE + (pin & 7)));
            break;
        }
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

/* The GPIO words, evaluated before the user program so PROG.FTH can call them.
 * Inert unless called: existing programs are byte-for-byte unaffected. */
static const char PRELUDE[] =
    ": pin! 132 sys ;\n"   /* ( pin value -- ) OUT to BW_GPIO_BASE+pin */
    ": pin@ 133 sys ;\n";  /* ( pin -- value ) IN  from BW_GPIO_BASE+pin */

int main(void)
{
    static zf_ctx ctx;   /* static: the DOS near heap is small */
    zf_init(&ctx, 0);
    zf_bootstrap(&ctx);
    eval_lines(&ctx, BOOTSTRAP);
    eval_lines(&ctx, PRELUDE);
    printf("zForth on DOS (8086)\n");
    include_file(&ctx, "PROG.FTH");
    return 0;
}
