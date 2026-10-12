( Drive an 8-pin GPIO strip from Forth: pin! ( pin value -- ) does an 8086 OUT )
( to BW_GPIO_BASE+pin, which the bench's onPortAccess maps to a device pin.    )
: main
  3 1 pin!      ( pin 3 on  )
  5 0 pin!      ( pin 5 off )
  7 1 pin!      ( pin 7 on  )
  2 42 pin!     ( pin 2 := 42, a non-boolean value )
  ." pins-set" cr
;
main
