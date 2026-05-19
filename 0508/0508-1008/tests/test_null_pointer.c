#include <stdlib.h>
#include <stdio.h>

void test_definite_null_dereference() {
    int* ptr = NULL;
    *ptr = 42;
}

void test_potential_null_dereference(int flag) {
    int* ptr = NULL;
    if (flag) {
        ptr = (int*)malloc(sizeof(int));
    }
    *ptr = 42;
    if (flag) {
        free(ptr);
    }
}

void test_checked_pointer() {
    int* ptr = (int*)malloc(sizeof(int));
    if (ptr != NULL) {
        *ptr = 42;
        free(ptr);
    }
}

void test_null_function_pointer() {
    void (*func)(void) = NULL;
    func();
}

void test_array_access_null() {
    int* arr = NULL;
    arr[0] = 42;
}

int main() {
    test_definite_null_dereference();
    test_potential_null_dereference(0);
    test_checked_pointer();
    test_array_access_null();
    return 0;
}
