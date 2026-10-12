/*
 * zForth-IO on DOS — the DOS-native Forth (forth-dos) with a GPIO bridge. It
 * runs on the bw-board 8086 DOS bench exactly like forth.exe, but adds two
 * words that drive the machine's I/O ports: `pin!` ( pin value -- ) does an
 * 8086 OUT to port BW_GPIO_BASE+pin, and `pin@` ( pin -- value ) does an IN.
 * The bench's machine.hooks.onPortAccess observes every OUT/IN, so the lite
 * runner maps a port write onto a device register (an 8-pin GPIO strip). This
 * is the "drive the board" bridge: a generated Forth word -> sys -> OUT ->
 * onPortAccess -> device. See docs/CODE-TAB-LANGUAGE-DEVICE-BRIDGE.md.
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
        case ZF_SYSCALL_USER + 1:   /* sin, kept for parity */
            zf_push(ctx, (zf_cell)sin(zf_pop(ctx)));
            break;
        case ZF_SYSCALL_USER + 4: { /* pin!  ( pin value -- ) */
            int value = (int)zf_pop(ctx);
            int pin = (int)zf_pop(ctx);
            bw_outb(BW_GPIO_BASE + (pin & 7), (unsigned char)value);
            break;
        }
        case ZF_SYSCALL_USER + 5: { /* pin@  ( pin -- value ) */
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

void zf_host_trace(zf_ctx *ctx, const char *fmt, va_list va) { (void)ctx; (void)fmt; (void)va; }

zf_cell zf_host_parse_num(zf_ctx *ctx, const char *buf)
{
    zf_cell v; int n = 0;
    int r = sscanf(buf, ZF_SCAN_FMT "%n", &v, &n);
    if (r != 1 || buf[n] != '\0') zf_abort(ctx, ZF_ABORT_NOT_A_WORD);
    return v;
}

static void eval_lines(zf_ctx *ctx, const char *s)
{
    char line[256]; size_t i = 0;
    while (*s) {
        char c = *s++;
        if (c == '\n' || i == sizeof(line) - 1) { line[i] = '\0'; if (i) zf_eval(ctx, line); i = 0; }
        else if (c != '\r') line[i++] = c;
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

/* The GPIO words, evaluated before the user program so PROG.FTH can call them. */
static const char PRELUDE[] =
    ": pin! 132 sys ;\n"   /* ( pin value -- ) OUT to BW_GPIO_BASE+pin */
    ": pin@ 133 sys ;\n";  /* ( pin -- value ) IN  from BW_GPIO_BASE+pin */

int main(void)
{
    static zf_ctx ctx;
    zf_init(&ctx, 0);
    zf_bootstrap(&ctx);
    eval_lines(&ctx, BOOTSTRAP);
    eval_lines(&ctx, PRELUDE);
    printf("zForth-IO on DOS (8086)\n");
    include_file(&ctx, "PROG.FTH");
    return 0;
}
