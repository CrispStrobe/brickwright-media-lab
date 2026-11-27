; BrickWright ACIA platform for Tali Forth 2.
; Original platform adaptation for this project, public domain (see LICENSE).
; Assemble from upstream platform/brickwright/platform.asm with 64tass 1.60.3243.
        .cpu "w65c02"
        .enc "none"

; Physical RAM is $0000-$3fff. Reserve $3000-$37ff for the 64x32 byte
; framebuffer, and $3800-$3fff for experiments, outside Tali's allocator.
ram_end = $2fff
TALI_OPTIONAL_WORDS := [ "assembler", "disassembler", "wordlist" ]
TALI_OPTION_CR_EOL := [ "lf" ]
TALI_OPTION_MAX_COLS := 80
TALI_OPTION_HISTORY := 1
TALI_OPTION_TERSE := 0

ACIA_DATA = $5000
ACIA_STATUS = $5001
ACIA_COMMAND = $5002
ACIA_CONTROL = $5003
VIA_PORTB = $6000
VIA_DDRB = $6002
FRAME_START = $3000
FRAME_END = $3800
FRAME_PTR = $f0

        * = $8000
.include "../../taliforth.asm"

kernel_init:
        sei
        cld
        ldx #$ff
        txs
        stz ACIA_STATUS         ; programmed reset
        lda #$1f                ; 8 data bits, 1 stop, internal 19200 baud
        sta ACIA_CONTROL
        lda #$0b                ; DTR active, RX IRQ disabled, TX IRQ off
        sta ACIA_COMMAND
        lda #$ff
        sta VIA_DDRB
        stz VIA_PORTB

        ; Initialize video through guest CPU writes, not manifest preload.
        stz FRAME_PTR
        lda #>FRAME_START
        sta FRAME_PTR+1
        ldy #0
        lda #0
_clear:
        sta (FRAME_PTR),y
        iny
        bne _clear
        inc FRAME_PTR+1
        ldx FRAME_PTR+1
        cpx #>FRAME_END
        bne _clear

        ldx #0
_banner:
        lda s_kernel_id,x
        beq _ready
        jsr kernel_putc
        inx
        bra _banner
_ready:
        jmp forth

kernel_putc:
        ; Preserve X/Y, as required by Tali's kernel interface.
        ; TDRE polling matches bw-board's ACIA model. This is not a claim
        ; about the TX timing bug on current physical WDC 65C51 silicon.
        pha
_wait_tx:
        lda ACIA_STATUS
        and #$10
        beq _wait_tx
        pla
        sta ACIA_DATA
        rts

kernel_getc:
_wait_rx:
        lda ACIA_STATUS
        and #$08
        beq _wait_rx
        lda ACIA_DATA
        rts

kernel_kbhit:
        lda ACIA_STATUS
        and #$08
        rts

kernel_bye:
        stp                     ; Reset or a fresh session starts again.
kernel_interrupt:
        rti

s_kernel_id:
        .text "BrickWright Tali Forth 2 - 65C02 / ACIA", AscLF, 0

        .cerror * > $fffa, "Tali ROM overlaps interrupt vectors"
        * = $fffa
        .word kernel_interrupt, kernel_init, kernel_interrupt
