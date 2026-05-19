#include <stdlib.h>
#include <stdio.h>

void test_double_free_simple() {
    int* ptr = (int*)malloc(sizeof(int));
    free(ptr);
    free(ptr);
}

void test_double_free_conditional(int flag) {
    int* ptr = (int*)malloc(sizeof(int));
    free(ptr);
    if (flag) {
        free(ptr);
    }
}

void test_double_free_in_loop() {
    int* arr[10];
    for (int i = 0; i < 10; i++) {
        arr[i] = (int*)malloc(sizeof(int));
    }
    for (int i = 0; i < 10; i++) {
        free(arr[i]);
    }
    free(arr[5]);
}

void test_double_free_with_reassignment() {
    int* ptr = (int*)malloc(sizeof(int));
    free(ptr);
    ptr = (int*)malloc(sizeof(int));
    free(ptr);
}

int main() {
    test_double_free_simple();
    test_double_free_conditional(1);
    test_double_free_in_loop();
    test_double_free_with_reassignment();
    return 0;
}
