#include <stdlib.h>
#include <stdio.h>

void test_use_after_free_simple() {
    int* ptr = (int*)malloc(sizeof(int));
    free(ptr);
    *ptr = 42;
}

void test_use_after_free_conditional(int flag) {
    int* ptr = (int*)malloc(sizeof(int));
    if (flag) {
        free(ptr);
    }
    *ptr = 42;
    if (!flag) {
        free(ptr);
    }
}

void test_use_after_free_in_function() {
    int* ptr = (int*)malloc(sizeof(int));
    free(ptr);
    printf("%d\n", *ptr);
}

void test_use_after_free_array() {
    int* arr = (int*)malloc(10 * sizeof(int));
    free(arr);
    arr[5] = 42;
}

void test_double_pointer_uaf() {
    int** ptr = (int**)malloc(sizeof(int*));
    *ptr = (int*)malloc(sizeof(int));
    free(*ptr);
    **ptr = 42;
    free(ptr);
}

int main() {
    test_use_after_free_simple();
    test_use_after_free_conditional(1);
    test_use_after_free_in_function();
    test_use_after_free_array();
    test_double_pointer_uaf();
    return 0;
}
