( --- variables --- )
var k
var _r0
( --- program --- )
: banner
  ." zForth on CP/M (Z80)" cr
;
: main
  banner
  7 7 * . cr
  0 k !
  ( repeat )
  3 _r0 !
  begin
    _r0 @ 0 > if
      1 k +!
      k @ . cr
    fi
    -1 _r0 +!
    _r0 @ 0 <=
  until
  ." done" cr
;
main
