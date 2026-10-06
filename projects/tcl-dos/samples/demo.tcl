puts "partcl on DOS (8086)"
set x 6
puts [* $x 7]
proc fact {n} { if {<= $n 1} {return 1} {return [* $n [fact [- $n 1]]]} }
puts [fact 5]
puts [fact 6]
