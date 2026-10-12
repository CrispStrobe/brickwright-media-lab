/*
 * zForth on CP/M-80 (Z80), file-reading variant: like FORTH.COM but it reads
 * its program from a mounted CP/M file PROG.FTH (BDOS open/read-sequential)
 * instead of embedding it — so it runs ARBITRARY Code-tab Forth output on the
 * Z80/CP-M machine, the way forth-dos reads PROG.FTH on the 8086 bench. Integer
 * cells, BDOS console out, no printf/va_list (ZF_ENABLE_TRACE 0).
 */
#include <stdarg.h>
#include "zforth.h"
#include "bootstrap.inc"

/* --- BDOS primitives (CALL 5) --- */
volatile unsigned char bd_a;
volatile unsigned int  bd_de;
static unsigned char bdos(unsigned char fn, unsigned int de) {
    bd_a = fn; bd_de = de;
    __asm
        ld   a,(_bd_a)
        ld   c,a
        ld   hl,(_bd_de)
        ex   de,hl
        call 5
        ld   (_bd_a),a
    __endasm;
    return bd_a;
}
static void putch(char c) { if (c == '\n') bdos(2, '\r'); bdos(2, (unsigned char)c); }
static void putn(long n) {
    unsigned long u; char b[12]; signed char i = 0;
    if (n < 0) { putch('-'); u = (unsigned long)(-n); } else { u = (unsigned long)n; }
    if (!u) { putch('0'); return; }
    while (u) { b[i++] = (char)('0' + (char)(u % 10)); u /= 10; }
    while (i) putch(b[--i]);
}

zf_input_state zf_host_sys(zf_ctx *ctx, zf_syscall_id id, const char *input) {
    switch ((int)id) {
    case ZF_SYSCALL_EMIT: putch((char)(long)zf_pop(ctx)); break;
    case ZF_SYSCALL_PRINT: putn((long)zf_pop(ctx)); putch(' '); break;
    case ZF_SYSCALL_TELL: {
        zf_cell len = zf_pop(ctx); zf_cell addr = zf_pop(ctx);
        unsigned char *buf = (unsigned char *)zf_dump(ctx, (zf_addr *)0) + (int)addr;
        int k; for (k = 0; k < (int)len; k++) putch((char)buf[k]);
        break;
    }
    case ZF_SYSCALL_USER + 0: putch('\n'); break;
    default: break;
    }
    (void)input; return ZF_INPUT_INTERPRET;
}
void zf_host_trace(zf_ctx *ctx, const char *fmt, va_list va) { (void)ctx; (void)fmt; (void)va; }
zf_cell zf_host_parse_num(zf_ctx *ctx, const char *buf) {
    const char *p = buf; long v = 0; int neg = 0;
    if (*p == '-') { neg = 1; p++; } else if (*p == '+') { p++; }
    if (!*p) zf_abort(ctx, ZF_ABORT_NOT_A_WORD);
    while (*p) { if (*p < '0' || *p > '9') zf_abort(ctx, ZF_ABORT_NOT_A_WORD); v = v * 10 + (*p - '0'); p++; }
    return neg ? -v : v;
}

static void eval_lines(zf_ctx *ctx, const char *s) {
    char line[128]; unsigned i = 0;
    while (*s) {
        char c = *s++;
        if (c == '\n' || i == sizeof(line) - 1) { line[i] = '\0'; if (i) zf_eval(ctx, line); i = 0; }
        else if (c != '\r') line[i++] = c;
    }
    if (i) { line[i] = '\0'; zf_eval(ctx, line); }
}

/* FCB for PROG.FTH at a fixed spot; 36 bytes. drive 0 = default. */
static unsigned char fcb[36];
static unsigned char dma[128];
static char linebuf[128];
static unsigned linelen;

static void feed(zf_ctx *ctx, char c) {
    if (c == '\r') return;
    if (c == 0x1a) return;                 /* CP/M EOF padding */
    if (c == '\n' || linelen == sizeof(linebuf) - 1) {
        linebuf[linelen] = '\0';
        if (linelen) zf_eval(ctx, linebuf);
        linelen = 0;
    } else {
        linebuf[linelen++] = c;
    }
}

static void run_file(zf_ctx *ctx) {
    static const char name[11] = {'P','R','O','G',' ',' ',' ',' ','F','T','H'};
    int k;
    for (k = 0; k < 36; k++) fcb[k] = 0;
    for (k = 0; k < 11; k++) fcb[1 + k] = name[k];
    if (bdos(15, (unsigned int)fcb) == 0xff) { putch('?'); putch('\n'); return; }  /* open failed */
    for (;;) {
        bdos(26, (unsigned int)dma);        /* set DMA */
        if (bdos(20, (unsigned int)fcb) != 0) break;   /* read sequential; nonzero = EOF */
        for (k = 0; k < 128; k++) feed(ctx, (char)dma[k]);
    }
    if (linelen) { linebuf[linelen] = '\0'; zf_eval(ctx, linebuf); linelen = 0; }
}

void main(void) {
    static zf_ctx ctx;
    zf_init(&ctx, 0);
    zf_bootstrap(&ctx);
    eval_lines(&ctx, BOOTSTRAP);
    run_file(&ctx);
}
