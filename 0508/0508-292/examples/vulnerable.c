#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

#define MAX_INPUT 1024

void process_data(const uint8_t *data, size_t len) {
    if (len < 4) return;
    
    if (data[0] == 'F' && data[1] == 'U' && data[2] == 'Z' && data[3] == 'Z') {
        if (len > 8) {
            uint32_t offset = *(uint32_t *)(data + 4);
            
            if (offset == 0xdeadbeef) {
                abort();
            }
            
            if (offset == 0xcafebabe) {
                char buf[16];
                memcpy(buf, data + 8, len - 8);
            }
            
            if (offset == 0x13371337) {
                int *ptr = NULL;
                *ptr = 42;
            }
        }
    }
    
    if (len > 10 && data[0] == 'S' && data[1] == 'T' && data[2] == 'A' && data[3] == 'C' && data[4] == 'K') {
        char small_buf[8];
        memcpy(small_buf, data + 5, len - 5);
    }
    
    if (len > 20) {
        if (data[10] == 'H' && data[11] == 'E' && data[12] == 'A' && data[13] == 'P') {
            char *heap_buf = (char *)malloc(16);
            if (heap_buf) {
                memcpy(heap_buf, data + 14, len - 14);
                free(heap_buf);
            }
        }
    }
}

int main(int argc, char *argv[]) {
    uint8_t input[MAX_INPUT];
    size_t len;
    
    len = fread(input, 1, MAX_INPUT, stdin);
    
    if (len == 0) {
        return 0;
    }
    
    process_data(input, len);
    
    return 0;
}
