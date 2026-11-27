\ This 64 by 32 grayscale framebuffer lives outside Tali's allocator.
\ A pixel is one byte. X and Y must be within 0..63 and 0..31.
decimal
: pixel ( x y color -- ) >r 64 * + 12288 + r> swap c! ;
: clear-screen 12288 2048 0 fill ;
: checker 32 0 do 64 0 do i j + 1 and 255 * i j rot pixel loop loop ;
clear-screen
checker
\ Change a single pixel after the pattern is complete.
0 0 85 pixel
