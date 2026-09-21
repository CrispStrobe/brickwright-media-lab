#include <stdio.h>

int main()
{
	int i;
	long f;

	f = 1;
	printf("Factorials, compiled by ACK, running on the 8086:\n");
	for (i = 1; i <= 8; i++) {
		f = f * i;
		printf("%d! = %ld\n", i, f);
	}
	return 0;
}
