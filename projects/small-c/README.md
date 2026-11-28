# Small-C 2.5 on 8086 DOS

Brickwright runs J. E. Hendrix’s Small-C compiler, Small-Assembler and Zane
Wagner’s YLink on the 8086 DOS service. The programs share an in-memory DOS
filesystem during the build.

Open **Machines → 8086 → Small-C 2.5 (DOS)** and choose **Run**. The Controller
console should print `SMALL-C RESULT 42`. Edit the sample in the C tab and run it
again to rebuild your changes. Small-C accepts a subset of K&R C.

The build runs `CC PROG -w`, `ASM PROG`, then
`YLINK PROG.OBJ CLIB.LIB -e=PROG.EXE`. It runs the resulting `PROG.EXE` in the
DOS service. The supplied `STDIO.H` and `CLIB.LIB` provide console I/O.

The manifest and fetch script pin every guest artifact to a reviewed
[Small-C revision](https://github.com/ZaneDubya/Small-C/tree/dfd563f56c35633ba61b7a2ab1dea3c5097ed7ef)
with SHA-256 hashes. See the [public-domain notice](PUBLIC-DOMAIN.txt) for
the original rights and author credits.
