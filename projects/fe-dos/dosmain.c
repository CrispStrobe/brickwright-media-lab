/*
 * dosmain.c - DOS front-end for the fe Lisp interpreter (rxi, MIT).
 *
 * Reads a fe program from PROG.FE on the current drive and evaluates each
 * top-level form through rxi's fe core; the script's own (print ...) calls
 * land on stdout via the C library (INT 21h on the target). Built for 16-bit
 * MS-DOS with ia16-elf-gcc. Placed in the public domain by its author; the fe
 * core it drives is MIT (Copyright (c) 2020 rxi).
 */
#include <stdio.h>
#include "fe.h"

static char arena[32000];   /* fe object pool — fits one 8086 data segment */

int main(int argc, char **argv) {
    const char *path = (argc > 1) ? argv[1] : "PROG.FE";
    FILE *fp;
    fe_Context *ctx;
    fe_Object *obj;
    int gc;

    fp = fopen(path, "rb");
    if (fp == NULL) { printf("fe: cannot open %s\n", path); return 2; }

    ctx = fe_open(arena, sizeof(arena));
    gc = fe_savegc(ctx);
    while ((obj = fe_readfp(ctx, fp)) != NULL) {
        fe_eval(ctx, obj);
        fe_restoregc(ctx, gc);
    }
    fe_close(ctx);
    fclose(fp);
    return 0;
}
