/* sieve.c — Sieve of Eratosthenes for CP/M 2.2 (BSD, written for BrickWright).
   Prints the primes below 50 via BDOS function 2, proving a genuine
   SDCC-compiled C program runs on the CP/M layer. */
volatile char bdch;
static void putch(char c) {
    bdch = c;
    __asm
        ld   a,(_bdch)
        ld   e,a
        ld   c,#2
        call 5
    __endasm;
}
static void puts_(const char *s) { while (*s) putch(*s++); }
static void putn(unsigned n) {
    char b[6]; signed char i = 0;
    if (!n) { putch('0'); return; }
    while (n) { b[i++] = '0' + n % 10; n /= 10; }
    while (i) putch(b[--i]);
}
#define N 50
static unsigned char composite[N];
void main(void) {
    unsigned i, j;
    for (i = 0; i < N; i++) composite[i] = 0;
    puts_("Primes below 50 (SDCC C on CP/M):\r\n");
    for (i = 2; i < N; i++) {
        if (!composite[i]) {
            putn(i); putch(' ');
            for (j = i + i; j < N; j += i) composite[j] = 1;
        }
    }
    puts_("\r\n");
}
