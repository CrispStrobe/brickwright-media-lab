; SPDX-License-Identifier: MIT
; Initialize PAL-1 SPI, then read the first 16 bytes of SDHC block 1.
.setcpu "6502"
.segment "CODE"
PA = $1700
DDRA = $1701
outgoing = $20
incoming = $21
pins = $22
    lda #$ff
    sta $0300
    lda #$10
    sta PA
    lda #$1c
    sta DDRA
    lda #0
    sta PA
    ldx #0
    jsr command
    cmp #1
    bne failed
    ldx #6
    jsr command
    cmp #1
    bne failed
    ldx #12
    jsr command
    cmp #1
    bne failed
    ldx #6
    jsr command
    cmp #1
    bne failed
    ldx #12
    jsr command
    cmp #0
    bne failed
    ldx #18
    jsr command
    cmp #0
    bne failed
    jsr response
    cmp #$fe
    bne failed
    ldx #0
read:
    lda #$ff
    jsr transfer
    sta $0310,x
    inx
    cpx #16
    bne read
    lda #$5a
    sta $0300
failed:
    lda #$10
    sta PA
    brk
command:
    lda #6
    sta $23
send:
    lda frames,x
    jsr transfer
    inx
    dec $23
    bne send
response:
    lda #16
    sta $24
poll:
    lda #$ff
    jsr transfer
    cmp #$ff
    bne received
    dec $24
    bne poll
received:
    rts
transfer:
    sta outgoing
    lda #0
    sta incoming
    ldy #8
bitloop:
    lda #0
    asl outgoing
    bcc low
    lda #4
low:
    sta pins
    sta PA
    ora #8
    sta PA
    lda PA
    lsr a
    lsr a
    rol incoming
    lda pins
    sta PA
    dey
    bne bitloop
    lda incoming
    rts
frames:
    .byte $40, 0, 0, 0, 0, $95
    .byte $77, 0, 0, 0, 0, $01
    .byte $69, $40, 0, 0, 0, $01
    .byte $51, 0, 0, 0, 1, $01
