; SPDX-License-Identifier: MIT
; Read the first 16 bytes of 512-byte block 1 from Corsham drive 0.
.setcpu "6502"
.segment "CODE"
PA = $1700
DDRA = $1701
PB = $1702
DDRB = $1703
    lda #$ff
    sta $0300
    sta DDRA
    lda #3
    sta DDRB
    lda #1
    sta PB
    ldx #0
send:
    lda request,x
    sta PA
    lda #3
    sta PB
    lda PB
    and #4
    beq failed
    lda #1
    sta PB
    inx
    cpx #7
    bne send
    lda #0
    sta DDRA
    sta PB
    jsr receive
    cmp #$94
    bne failed
    ldx #0
read:
    jsr receive
    sta $0310,x
    inx
    cpx #16
    bne read
    lda #$5a
    sta $0300
failed:
    brk
receive:
    lda PB
    and #4
    beq failed
    lda PA
    ldy #2
    sty PB
    ldy #0
    sty PB
    rts
request:
    .byte $1f, 0, 3, 0, 0, 0, 1
