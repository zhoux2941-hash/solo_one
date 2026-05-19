#include <stdlib.h>
#include <string.h>

void* my_malloc(size_t size) {
    return malloc(size);
}

void my_free(void* ptr) {
    free(ptr);
}

char* process_string(const char* input) {
    if (input == NULL) {
        return NULL;
    }
    
    size_t len = strlen(input);
    char* result = (char*)my_malloc(len + 1);
    if (result == NULL) {
        return NULL;
    }
    
    strcpy(result, input);
    
    for (size_t i = 0; i < len; i++) {
        if (result[i] >= 'a' && result[i] <= 'z') {
            result[i] = result[i] - 'a' + 'A';
        }
    }
    
    return result;
}

int* create_array(int size) {
    if (size <= 0) {
        return NULL;
    }
    
    int* arr = (int*)malloc(size * sizeof(int));
    if (!arr) {
        return NULL;
    }
    
    for (int i = 0; i < size; i++) {
        arr[i] = i * 2;
    }
    
    return arr;
}

void test_all_issues() {
    int* null_ptr = NULL;
    *null_ptr = 42;
    
    int* uaf_ptr = (int*)malloc(sizeof(int));
    free(uaf_ptr);
    *uaf_ptr = 100;
    
    int* df_ptr = (int*)malloc(sizeof(int));
    free(df_ptr);
    free(df_ptr);
    
    int* leak_ptr = (int*)malloc(sizeof(int));
    *leak_ptr = 200;
}

int main(int argc, char** argv) {
    if (argc < 2) {
        return 1;
    }
    
    char* upper = process_string(argv[1]);
    if (upper) {
        free(upper);
    }
    
    int* arr = create_array(10);
    if (arr) {
        free(arr);
    }
    
    test_all_issues();
    
    return 0;
}
