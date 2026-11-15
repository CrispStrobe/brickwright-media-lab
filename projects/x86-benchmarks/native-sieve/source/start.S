/* MIT. Fixed-address freestanding startup; loader supplies flat 32-bit segments. */
.code32
.section .text.start,"ax"
.global _start
_start:
 movl $0x90000,%esp
 call benchmark
 cli
 hlt
