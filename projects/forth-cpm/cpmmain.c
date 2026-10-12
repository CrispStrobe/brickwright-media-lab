/*
 * zForth on CP/M-80 (Z80) — the SAME tiny Forth (zevv/zForth, MIT) the lab
 * ships as a DOS program (projects/forth-dos), recompiled for a *non-DOS*
 * target: a Z80 CP/M 2.2 .COM that runs on the browser CP/M bench. It proves
 * the interpreter (and so a Code-tab Forth program) is target-portable; only
 * the run backend is machine-specific.
 *
 * SDCC-z80 has no cheap float, so the cell is a 32-bit integer (cpminc/zfconf.h);
 * division is integer. Output goes through BDOS function 2 (no printf/varargs),
 * the program is embedded (no CP/M file I/O), and trace is off (no va_list).
 */
#include <stdarg.h>
#include "zforth.h"
#include "bootstrap.inc"
#include "prog.inc"

/* BDOS console-out (function 2). \n is sent as CR LF for the CP/M console. */
volatile char bdch;
static void bdos2(char c) {
    bdch = c;
    __asm
        ld   a,(_bdch)
        ld   e,a
        ld   c,#2
        call 5
    __endasm;
}
static void putch(char c) { if (c == '\n') bdos2('\r'); bdos2(c); }
static void putn(long n) {
    unsigned long u; char b[12]; signed char i = 0;
    if (n < 0) { putch('-'); u = (unsigned long)(-n); } else { u = (unsigned long)n; }
    if (!u) { putch('0'); return; }
    while (u) { b[i++] = (char)('0' + (char)(u % 10)); u /= 10; }
    while (i) putch(b[--i]);
}

zf_input_state zf_host_sys(zf_ctx *ctx, zf_syscall_id id, const char *input) {
    switch ((int)id) {
    case ZF_SYSCALL_EMIT:
        putch((char)(long)zf_pop(ctx));
        break;
    case ZF_SYSCALL_PRINT:
        putn((long)zf_pop(ctx));
        putch(' ');
        break;
    case ZF_SYSCALL_TELL: {
        zf_cell len = zf_pop(ctx);
        zf_cell addr = zf_pop(ctx);
        unsigned char *buf = (unsigned char *)zf_dump(ctx, (zf_addr *)0) + (int)addr;
        int k; for (k = 0; k < (int)len; k++) putch((char)buf[k]);
        break;
    }
    case ZF_SYSCALL_USER + 0:   /* bye */
        putch('\n');
        break;
    default:
        break;
    }
    (void)input;
    return ZF_INPUT_INTERPRET;
}

void zf_host_trace(zf_ctx *ctx, const char *fmt, va_list va) { (void)ctx; (void)fmt; (void)va; }

/* Parse a signed decimal integer; abort if the word is not a whole number. */
zf_cell zf_host_parse_num(zf_ctx *ctx, const char *buf) {
    const char *p = buf; long v = 0; int neg = 0;
    if (*p == '-') { neg = 1; p++; } else if (*p == '+') { p++; }
    if (!*p) zf_abort(ctx, ZF_ABORT_NOT_A_WORD);
    while (*p) {
        if (*p < '0' || *p > '9') zf_abort(ctx, ZF_ABORT_NOT_A_WORD);
        v = v * 10 + (*p - '0');
        p++;
    }
    return neg ? -v : v;
}

static void eval_lines(zf_ctx *ctx, const char *s) {
    char line[128]; unsigned i = 0;
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

void main(void) {
    static zf_ctx ctx;
    zf_init(&ctx, 0);
    zf_bootstrap(&ctx);
    eval_lines(&ctx, BOOTSTRAP);
    eval_lines(&ctx, PROG);
}
