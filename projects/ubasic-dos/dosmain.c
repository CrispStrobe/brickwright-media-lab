/*
 * dosmain.c - DOS front-end for the uBASIC interpreter.
 *
 * Reads a BASIC program from PROG.BAS on the current drive, runs it through
 * Adam Dunkels' uBASIC core, and prints the output via the C library (which
 * lands on INT 21h / INT 10h on the target). Built for 16-bit MS-DOS with
 * ia16-elf-gcc.
 *
 * Written for the brickwright media-lab "ubasic-dos" project. Placed in the
 * public domain by its author; the uBASIC core it drives is BSD-3-Clause
 * (Copyright (c) 2006 Adam Dunkels; 2013 Danyil Bohdan).
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "ubasic.h"

#define MAX_PROGRAM 16384

static char program[MAX_PROGRAM + 1];

int
main(int argc, char **argv)
{
  const char *path = (argc > 1) ? argv[1] : "PROG.BAS";
  FILE *f;
  size_t n, i, j;
  char raw[MAX_PROGRAM + 1];

  f = fopen(path, "rb");
  if (f == NULL) {
    printf("ubasic: cannot open %s\n", path);
    return 2;
  }
  n = fread(raw, 1, MAX_PROGRAM, f);
  fclose(f);
  raw[n] = '\0';

  /* Normalise CRLF/CR to LF so the tokenizer sees clean line breaks. */
  for (i = 0, j = 0; i < n; i++) {
    if (raw[i] == '\r') {
      if (i + 1 < n && raw[i + 1] == '\n') continue; /* CRLF -> drop CR */
      program[j++] = '\n';                            /* lone CR -> LF   */
    } else {
      program[j++] = raw[i];
    }
  }
  if (j == 0 || program[j - 1] != '\n') program[j++] = '\n';
  program[j] = '\0';

  ubasic_init(program);
  do {
    ubasic_run();
  } while (!ubasic_finished());

  return 0;
}
