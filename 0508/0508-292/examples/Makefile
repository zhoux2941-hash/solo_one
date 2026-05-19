CC = gcc
CFLAGS = -fprofile-arcs -ftest-coverage -fsanitize=address -g -O0
TARGET = vulnerable

all: $(TARGET)

$(TARGET): vulnerable.c
	$(CC) $(CFLAGS) -o $(TARGET) vulnerable.c

clean:
	rm -f $(TARGET) *.gcno *.gcda *.o

.PHONY: all clean
