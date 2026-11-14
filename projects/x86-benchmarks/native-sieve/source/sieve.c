/* MIT. Owned freestanding integer-workload control; not TOPBENCH or Dhrystone. */
#define N 8192
static unsigned char flags[N];
static void putc(char c) { __asm__ volatile("outb %0,%1"::"a"(c),"Nd"((unsigned short)0x3f8)); }
static void puts(const char *s) { while (*s) putc(*s++); }
static void putu(unsigned n) { char b[12]; unsigned k=0; do { b[k++]=(char)('0'+n%10); n/=10; } while(n); while(k)putc(b[--k]); }
void benchmark(void) {
 unsigned pass,i,j,count=0,sum=0;
 for(pass=0;pass<20;pass++) {
  for(i=0;i<N;i++)flags[i]=1;
  flags[0]=flags[1]=0;
  for(i=2;i*i<N;i++)if(flags[i])for(j=i*i;j<N;j+=i)flags[j]=0;
  count=0;sum=0;
  for(i=2;i<N;i++)if(flags[i]) {count++;sum+=i;}
 }
 puts("NATIVE386 SIEVE n=8192 passes=20 primes=");putu(count);puts(" sum=");putu(sum);puts("\n");
 __asm__ volatile("cli; hlt");
 for(;;){}
}
