MODULE sieve;

FROM InOut IMPORT WriteInt, WriteLn, WriteString;

CONST max = 50;

VAR
	flags : ARRAY [0..max] OF BOOLEAN;
	i, j  : INTEGER;

BEGIN
	FOR i := 2 TO max DO
		flags[i] := TRUE;
	END;

	WriteString("Primes up to 50, from Modula-2:");
	WriteLn;

	FOR i := 2 TO max DO
		IF flags[i] THEN
			WriteInt(i, 4);
			j := i + i;
			WHILE j <= max DO
				flags[j] := FALSE;
				j := j + i;
			END;
		END;
	END;
	WriteLn;
	WriteString("done.");
	WriteLn;
END sieve.
