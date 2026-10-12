( Drive an 8-pin GPIO strip from Forth. pin! ( pin value -- ) does an 8086 OUT )
( to BW_GPIO_BASE+pin, which the bw-board bench's onPortAccess maps onto a      )
( device register; in brickwright-lite that lights an 8-pin GPIO widget. The    )
( words are inert unless called, so every other program is unaffected.          )
: main
  3 1 pin!      ( pin 3 on  )
  5 0 pin!      ( pin 5 off )
  7 1 pin!      ( pin 7 on  )
  2 42 pin!     ( pin 2 := 42, a non-boolean value )
  ." pins-set" cr
;
main
