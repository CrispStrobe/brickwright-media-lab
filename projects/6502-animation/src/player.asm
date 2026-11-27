; SPDX-License-Identifier: MIT
; Original BrickWright animation player. 6502 instructions only.
; 32 KiB ROM at $8000. Four or fewer raw 100x64 frames live in this ROM.
; The CPU copies them to $2000, with 128 bytes between screen rows.
; No SD card, host pixel injection, RLE, or delta decoder is involved.

        .include "constants.inc"

SOURCE      = $00                 ; two-byte ROM pointer
DESTINATION = $02                 ; two-byte framebuffer pointer
ROWS_LEFT   = $04
FRAME_INDEX = $05
FRAME_SERIAL = $0200              ; increments AFTER a complete frame
SHOWN_FRAME  = $0201              ; zero-based frame index

        * = $8000
reset:
        sei
        cld
        ldx #$ff
        txs
        lda #0
        sta FRAME_SERIAL
        sta SHOWN_FRAME
        sta FRAME_INDEX
        sta DESTINATION
        lda #$20
        sta DESTINATION+1

        ; Initialize all 8192 bytes, including the 28 hidden bytes per row.
        lda #0
        ldx #32
        ldy #0
clear_page:
        sta (DESTINATION),y
        iny
        bne clear_page
        inc DESTINATION+1
        dex
        bne clear_page

show_frame:
        lda FRAME_INDEX
        asl a
        tax
        lda frame_pointers,x
        sta SOURCE
        lda frame_pointers+1,x
        sta SOURCE+1
        lda #0
        sta DESTINATION
        lda #$20
        sta DESTINATION+1
        lda #64
        sta ROWS_LEFT
copy_row:
        ldy #0
copy_pixel:
        lda (SOURCE),y
        sta (DESTINATION),y
        iny
        cpy #100
        bne copy_pixel

        ; Input has 100 bytes per row; output has a 128-byte stride.
        clc
        lda SOURCE
        adc #100
        sta SOURCE
        bcc source_ready
        inc SOURCE+1
source_ready:
        clc
        lda DESTINATION
        adc #128
        sta DESTINATION
        bcc destination_ready
        inc DESTINATION+1
destination_ready:
        dec ROWS_LEFT
        bne copy_row

        lda FRAME_INDEX
        sta SHOWN_FRAME
        inc FRAME_SERIAL         ; publication point: every pixel is ready

        ; A software hold interval. Timing is guest CPU work, not video sync.
        ldx #HOLD_LOOPS
hold_outer:
        ldy #0
hold_inner:
        dey
        bne hold_inner
        dex
        bne hold_outer

        inc FRAME_INDEX
        lda FRAME_INDEX
        cmp #FRAME_COUNT
        bcc show_frame
        lda #0
        sta FRAME_INDEX
        jmp show_frame

interrupt:
        rti

frame_pointers:
        .include "pointers.inc"
        .align $100, $ff
frame_data:
        .binary "frames.bin"
        .fill $fffa - *, $ff
        .word interrupt, reset, interrupt
