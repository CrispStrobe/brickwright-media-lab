        .module crt0
        .globl  _main
        .area   _HEADER (ABS)
        .org    0x0100
init:
        call    gsinit          ; run SDCC global initializers
        call    _main
        rst     0x00            ; CP/M warm boot -> back to A>
        .area   _CODE
        .area   _INITIALIZER
        .area   _HOME
        .area   _GSINIT
gsinit:
        .area   _GSFINAL
        ret
        .area   _DATA
        .area   _INITIALIZED
        .area   _BSEG
        .area   _BSS
        .area   _HEAP
