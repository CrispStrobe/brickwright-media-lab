; SPDX-License-Identifier: MIT
; KIM-2 at $2000, KIM-3 at $4000 and KIM-3B at $6000.
.setcpu "6502"
.segment "CODE"
    ldx #0
write:
    txa
    sta $2000,x
    eor #$5a
    sta $4000,x
    eor #$ff
    sta $6000,x
    inx
    bne write
verify:
    txa
    cmp $2000,x
    bne failed
    eor #$5a
    cmp $4000,x
    bne failed
    eor #$ff
    cmp $6000,x
    bne failed
    inx
    bne verify
    lda #$5a
    bne report
failed:
    lda #$ff
report:
    sta $0300
    brk
