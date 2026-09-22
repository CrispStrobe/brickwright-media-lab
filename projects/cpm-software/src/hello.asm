; hello.com — a minimal CP/M 2.2 program (public domain, written for BrickWright).
; Prints a greeting via BDOS function 9 (print '$'-terminated string) and
; returns to CCP with a warm boot. Assemble: pasmo hello.asm hello.com
        org     0100h
bdos    equ     0005h
start:  ld      de,msg
        ld      c,9
        call    bdos
        jp      0000h           ; warm boot -> back to A>
msg:    db      'Hello from CP/M 2.2 on BrickWright!',13,10,'$'
        end     start
