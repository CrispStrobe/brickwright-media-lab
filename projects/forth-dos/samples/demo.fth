: sq dup * ;
7 sq .
6 7 * .
: cube dup dup * * ;
4 cube .
: countdown begin dup . 1 - dup 0 = until drop ;
5 countdown
