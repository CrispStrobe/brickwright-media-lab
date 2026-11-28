; SPDX-License-Identifier: BSD-3-Clause
; xKIM Corsham timer check, entry $0200.
.setcpu "6502"

PORTA  = $1700
DDRA   = $1701
PORTB  = $1702
DDRB   = $1703
OUTCH  = $1EA0
XKIM   = $E000
TICKS  = $40

.segment "CODE"
    sei
    lda #0
    sta TICKS
    lda #<tick
    sta $17FA
    sta $17FE
    lda #>tick
    sta $17FB
    sta $17FF
    lda #1
    jsr set_timer
    cmp #$82
    bne no_ack
    cli
    ldx #$60
    ldy #0
wait_tick:
    lda TICKS
    cmp #3
    bcs passed
    dey
    bne wait_tick
    dex
    bne wait_tick
    ldy #no_pulse - messages
    bne report
passed:
    ldy #ok - messages
    bne report
no_ack:
    ldy #no_response - messages
report:
    sei
    tya
    pha
    lda #0
    jsr set_timer
    pla
    tax
print:
    lda messages,x
    beq done
    txa
    pha
    lda messages,x
    jsr OUTCH
    pla
    tax
    inx
    bne print
done:
    jmp XKIM

tick:
    inc TICKS
    rti

; Send SET_TIMER and its interval, then read the controller reply.
set_timer:
    tax
    lda #$FF
    sta DDRA
    lda #3
    sta DDRB
    lda #1
    sta PORTB
    lda #$1E
    jsr send_byte
    txa
    jsr send_byte
    lda #0
    sta DDRA
    sta PORTB
wait_reply:
    lda PORTB
    and #4
    beq wait_reply
    lda PORTA
    pha
    lda #2
    sta PORTB
    lda #0
    sta PORTB
    pla
    rts

send_byte:
    sta PORTA
    lda #3
    sta PORTB
wait_ack:
    lda PORTB
    and #4
    beq wait_ack
    lda #1
    sta PORTB
    rts

messages:
    .byte 0
ok:
    .byte "TIMER OK", 13, 10, 0
no_pulse:
    .byte "NO TIMER INTERRUPT", 13, 10, 0
no_response:
    .byte "NO TIMER ACK", 13, 10, 0
