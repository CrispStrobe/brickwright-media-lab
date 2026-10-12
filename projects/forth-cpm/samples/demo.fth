( An arbitrary Code-tab-shaped Forth program, mounted as PROG.FTH and read
  over CP/M BDOS by FORTH.COM — proving the Z80/CP-M port is a GENERAL
  interpreter, not a fixed demo. )
var sum
var _r0
: banner
  ." zForth on CP/M (Z80)" cr
;
: main
  banner
  7 7 * . cr
  0 sum !
  ( repeat )
  4 _r0 !
  begin
    _r0 @ 0 > if
      10 sum +!
      sum @ . cr
    fi
    -1 _r0 +!
    _r0 @ 0 <=
  until
  ." total=" sum @ . cr
;
main
