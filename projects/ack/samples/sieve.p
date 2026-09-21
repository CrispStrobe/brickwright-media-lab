program sieve(output);

const
	max = 50;

var
	flags : array [2..max] of boolean;
	i, j  : integer;

begin
	for i := 2 to max do
		flags[i] := true;

	writeln('Primes up to ', max:0, ':');
	for i := 2 to max do
		if flags[i] then
			begin
				write(i:4);
				j := i + i;
				while j <= max do
					begin
						flags[j] := false;
						j := j + i
					end
			end;
	writeln;
	writeln('done.')
end.
