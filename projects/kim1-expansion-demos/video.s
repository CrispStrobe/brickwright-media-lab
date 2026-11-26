; SPDX-License-Identifier: MIT
; Draw a checkerboard on a K-1008 mapped at $2000.
.setcpu "6502"
.segment "CODE"
    lda #$00
    sta $20
    lda #$20
    sta $21
    ldx #200
    lda #$ff
row:
    ldy #0
column:
    sta ($20),y
    eor #$ff
    iny
    cpy #40
    bne column
    eor #$ff
    pha
    clc
    lda $20
    adc #40
    sta $20
    bcc next
    inc $21
next:
    pla
    dex
    bne row
    brk
