#include <stdlib.h>
#include <stdio.h>

void test_memory_leak_simple() {
    int* ptr = (int*)malloc(sizeof(int));
    *ptr = 42;
}

void test_memory_leak_conditional(int flag) {
    int* ptr = (int*)malloc(sizeof(int));
    if (flag) {
        free(ptr);
    }
}

void test_memory_leak_in_loop() {
    for (int i = 0; i < 10; i++) {
        int* ptr = (int*)malloc(sizeof(int));
        *ptr = i;
    }
}

void test_memory_leak_double_pointer() {
    int** ptr = (int**)malloc(sizeof(int*));
    *ptr = (int*)malloc(sizeof(int));
    **ptr = 42;
    free(ptr);
}

void test_no_leak() {
    int* ptr = (int*)malloc(sizeof(int));
    *ptr = 42;
    free(ptr);
}

int* test_return_allocated() {
    int* ptr = (int*)malloc(sizeof(int));
    *ptr = 42;
    return ptr;
}

static int* global_ptr = NULL;
void test_store_to_global() {
    global_ptr = (int*)malloc(sizeof(int));
    *global_ptr = 42;
}

void test_pass_to_external() {
    int* ptr = (int*)malloc(sizeof(int));
    *ptr = 42;
    printf("%d\n", *ptr);
}

int main() {
    test_memory_leak_simple();
    test_memory_leak_conditional(0);
    test_memory_leak_in_loop();
    test_memory_leak_double_pointer();
    test_no_leak();
    int* ret = test_return_allocated();
    free(ret);
    test_store_to_global();
    test_pass_to_external();
    free(global_ptr);
    return 0;
}
