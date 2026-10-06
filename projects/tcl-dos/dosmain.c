/*
 * dosmain.c - DOS front-end for partcl, zserge's minimal Tcl interpreter (MIT).
 *
 * Reads a Tcl script from PROG.TCL on the current drive and evaluates it with
 * partcl; the script's own `puts` command prints to stdout via the C library
 * (INT 21h on the target). Built for 16-bit MS-DOS with ia16-elf-gcc. Placed in
 * the public domain by its author; the partcl core it drives is MIT
 * (Copyright (c) 2016 Serge Zaitsev).
 *
 * partcl is a single translation unit (tcl.c, no header); include it directly
 * with TEST defined so its own stdin-REPL main() is dropped and this main used.
 */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define TEST 1            /* drop tcl.c's built-in REPL main() */
#include "tcl.c"

static char prog[16384];

int main(int argc, char** argv) {
    const char* path = (argc > 1) ? argv[1] : "PROG.TCL";
    FILE* f;
    size_t n;
    struct tcl tcl;

    f = fopen(path, "rb");
    if (f == NULL) { printf("tcl: cannot open %s\n", path); return 2; }
    n = fread(prog, 1, sizeof(prog) - 2, f);
    fclose(f);
    if (n == 0 || prog[n - 1] != '\n') prog[n++] = '\n';
    prog[n] = '\0';

    tcl_init(&tcl);
    tcl_eval(&tcl, prog, strlen(prog));
    tcl_destroy(&tcl);
    return 0;
}
