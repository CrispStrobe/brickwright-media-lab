# Owned freestanding Sieve — native i80386 integer control

MIT source, startup and linker script are owned by Brickwright contributors.
This is a simple real integer workload control, not TOPBENCH, Dhrystone or a
calibrated CPU score. It performs twenty complete Eratosthenes sieves of 8192
entries and reports the count/sum through the AT UART. An independent integer
reference gives 1028 primes with sum 3908641.

```sh
./fetch.sh  # source is already present; explicitly builds with installed GCC
node ../run.mjs --board "$BW_BOARD_DIR" --project .build --variant 80386 --max 10000000
```

`build.sh` records the actual GCC version/options and raw binary/source hashes.
No standard library, OS image, BIOS image, FPU, DPMI or DJGPP is linked or loaded.
`native-i80386.json` specifies raw32 format, load/entry `0x10000`, stack `0x90000`,
PCAT80386_EXPERIMENTAL, and exact serial output followed by HLT. The owned
loader seeds flat protected-mode segments before guest startup; this is an
explicit direct-load contract, not a firmware boot claim.

First bounded native-core run: 2,075,296 guest instructions, 12,451,776 functional
machine cycles; exact output:

```text
NATIVE386 SIEVE n=8192 passes=20 primes=1028 sum=3908641
```

Raw result records pin source/loader/compiler/binary. Host timing is separate
from the fixed functional clock charge and is not a speedup claim. Existing
xv6 improvements are a separate preserved result with a different workload.
The runner type is explicit; GUI wiring must select it and never FreeDOS.
