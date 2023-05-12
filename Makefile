CC=gcc
CFLAGS=-lbluetooth

main: main.c
	gcc $< -o $@ ${CFLAGS}

.PHONY: clean
clean:
	rm -f main *.o
