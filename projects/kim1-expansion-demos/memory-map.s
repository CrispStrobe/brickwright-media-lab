; SPDX-License-Identifier: MIT
; Exercise two writable addresses on the programmable memory card.
.setcpu "6502"
.segment "CODE"
    lda #$00
    sta $0300
    lda #$34
    sta $0400
    lda #$a7
    sta $fff9
    lda $0400
    cmp #$34
    bne failed
    lda $fff9
    cmp #$a7
    bne failed
    lda #$5a
    bne finish
failed:
    lda #$ff
finish:
    sta $0300
    brk
