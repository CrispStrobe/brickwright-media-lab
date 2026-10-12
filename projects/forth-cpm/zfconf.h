#ifndef zfconf
#define zfconf
#define ZF_ENABLE_TRACE 0
#define ZF_ENABLE_BOUNDARY_CHECKS 1
#define ZF_ENABLE_BOOTSTRAP 1
#define ZF_ENABLE_TYPED_MEM_ACCESS 1
/* Integer cells: SDCC-z80 has no cheap float. A signed 32-bit long gives
 * Scratch-sized integers; division is integer (7/2 == 3), which the shipped
 * DOS build (float cells) does not do — recorded as the one semantic gap. */
typedef long zf_cell;
#define ZF_CELL_FMT "%ld"
#define ZF_SCAN_FMT "%ld"
typedef int zf_int;
typedef unsigned int zf_addr;
#define ZF_ADDR_FMT "%04x"
#define ZF_DICT_SIZE 4096
#define ZF_DSTACK_SIZE 32
#define ZF_RSTACK_SIZE 32
#endif
