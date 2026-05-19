#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <errno.h>

int* allocate_memory(size_t size) {
    int* ptr = (int*)malloc(size * sizeof(int));
    if (!ptr) {
        fprintf(stderr, "Allocation failed\n");
        return NULL;
    }
    return ptr;
}

int test_unreachable_goto_error(int flag) {
    int* ptr = NULL;
    int result = 0;
    
    ptr = allocate_memory(10);
    if (!ptr) {
        goto error;
    }
    
    if (flag) {
        for (int i = 0; i < 10; i++) {
            ptr[i] = i;
            result += ptr[i];
        }
    }
    
    free(ptr);
    return result;
    
error:
    if (ptr) {
        free(ptr);
    }
    return -1;
}

int test_dead_error_path() {
    int* ptr = (int*)malloc(sizeof(int));
    if (!ptr) {
        fprintf(stderr, "Failed to allocate\n");
        return -1;
    }
    
    *ptr = 42;
    
    if (0) {
    error_path:
        free(ptr);
        fprintf(stderr, "This error path is never executed\n");
        return -1;
    }
    
    int result = *ptr;
    free(ptr);
    return result;
}

int test_always_true_condition(int* input) {
    int result = 0;
    
    if (input != NULL) {
        result = *input;
    } else {
        fprintf(stderr, "This error path may be reachable\n");
        result = -1;
    }
    
    return result;
}

int test_constant_false_branch() {
    int* ptr = (int*)malloc(sizeof(int));
    if (!ptr) {
        return -1;
    }
    
    *ptr = 100;
    
    if (sizeof(int) > 100) {
        free(ptr);
        fprintf(stderr, "This branch is impossible on any platform\n");
        return -1;
    }
    
    int result = *ptr;
    free(ptr);
    return result;
}

char* process_string(const char* input) {
    if (!input) {
        return NULL;
    }
    
    size_t len = strlen(input);
    char* output = (char*)malloc(len + 1);
    if (!output) {
        return NULL;
    }
    
    strcpy(output, input);
    
    if (1) {
        for (size_t i = 0; i < len; i++) {
            if (output[i] >= 'a' && output[i] <= 'z') {
                output[i] -= 32;
            }
        }
    } else {
    error_cleanup:
        free(output);
        return NULL;
    }
    
    return output;
}

int test_multiple_error_labels(int flag) {
    int* ptr1 = NULL;
    int* ptr2 = NULL;
    int result = -1;
    
    ptr1 = (int*)malloc(sizeof(int));
    if (!ptr1) {
        goto cleanup;
    }
    
    *ptr1 = 10;
    
    ptr2 = (int*)malloc(sizeof(int));
    if (!ptr2) {
        goto cleanup_ptr1;
    }
    
    *ptr2 = 20;
    
    if (flag) {
        result = *ptr1 + *ptr2;
    }
    
    free(ptr2);
cleanup_ptr1:
    free(ptr1);
cleanup:
    return result;
}

int test_reachable_error_handler(int value) {
    int* ptr = (int*)malloc(sizeof(int));
    if (!ptr) {
        fprintf(stderr, "This error handler IS reachable\n");
        return -1;
    }
    
    if (value > 100) {
        free(ptr);
        fprintf(stderr, "This is also reachable\n");
        return -2;
    }
    
    *ptr = value;
    int result = *ptr;
    free(ptr);
    return result;
}

int main() {
    int result1 = test_unreachable_goto_error(1);
    int result2 = test_dead_error_path();
    int x = 5;
    int result3 = test_always_true_condition(&x);
    int result4 = test_constant_false_branch();
    
    char* str = process_string("hello");
    if (str) {
        printf("Upper: %s\n", str);
        free(str);
    }
    
    int result5 = test_multiple_error_labels(1);
    int result6 = test_reachable_error_handler(50);
    
    printf("Results: %d, %d, %d, %d, %d, %d\n", 
           result1, result2, result3, result4, result5, result6);
    
    return 0;
}
