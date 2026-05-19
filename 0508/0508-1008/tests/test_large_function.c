#include <stdlib.h>
#include <string.h>
#include <stdio.h>

#define MAX_ITEMS 1000
#define BUFFER_SIZE 256

typedef struct {
    int id;
    char name[BUFFER_SIZE];
    void* data;
    size_t data_size;
    int flags;
    int ref_count;
    struct Item* next;
} Item;

typedef struct {
    Item* items[MAX_ITEMS];
    int count;
    int capacity;
    pthread_mutex_t mutex;
} Database;

int process_item_simple(Item* item, int mode) {
    if (!item) return -1;
    
    int result = 0;
    
    for (int i = 0; i < 100; i++) {
        if (mode == 0) {
            item->id += i;
            result += item->id;
        } else if (mode == 1) {
            if (item->name[i % BUFFER_SIZE]) {
                result += item->name[i % BUFFER_SIZE];
            }
        } else if (mode == 2) {
            if (item->data && i < (int)item->data_size) {
                result += ((char*)item->data)[i];
            }
        }
        
        for (int j = 0; j < 10; j++) {
            result += j;
        }
    }
    
    if (result > 1000) {
        return 1;
    } else if (result > 500) {
        return 0;
    } else {
        return -1;
    }
}

int process_item_complex(Item* item, int flags, int* output) {
    if (!item || !output) return -1;
    
    int result = 0;
    char* buffer = NULL;
    
    if (flags & 0x1) {
        buffer = (char*)malloc(BUFFER_SIZE);
        if (!buffer) {
            return -1;
        }
        memset(buffer, 0, BUFFER_SIZE);
    }
    
    for (int i = 0; i < 50; i++) {
        switch (flags & 0xF) {
            case 0:
                result += item->id * i;
                break;
            case 1:
                if (item->name[0]) {
                    result += item->name[0] + i;
                }
                break;
            case 2:
                if (item->data) {
                    result += (int)((char*)item->data)[0] + i;
                }
                break;
            case 3:
                result += item->ref_count + i;
                break;
            default:
                result += i;
                break;
        }
        
        if (buffer && i < BUFFER_SIZE - 1) {
            buffer[i] = (char)(result % 256);
        }
        
        for (int j = 0; j < 5; j++) {
            if (j % 2 == 0) {
                result += j * 2;
            } else {
                result -= j;
            }
        }
    }
    
    if (flags & 0x2) {
        for (int k = 0; k < 20; k++) {
            if (k % 3 == 0) {
                result *= 2;
            } else if (k % 3 == 1) {
                result /= 2;
            } else {
                result += k;
            }
        }
    }
    
    if (buffer) {
        free(buffer);
    }
    
    *output = result;
    return 0;
}

int process_database_simple(Database* db, int mode) {
    if (!db || db->count <= 0) return -1;
    
    int total = 0;
    
    for (int i = 0; i < db->count; i++) {
        Item* item = db->items[i];
        if (!item) continue;
        
        total += process_item_simple(item, mode);
        
        if (total > 10000) {
            break;
        }
    }
    
    return total;
}

int process_database_complex(Database* db, int flags) {
    if (!db) return -1;
    
    int total = 0;
    int errors = 0;
    
    for (int i = 0; i < db->count; i++) {
        Item* item = db->items[i];
        if (!item) {
            errors++;
            continue;
        }
        
        int output = 0;
        if (process_item_complex(item, flags, &output) == 0) {
            total += output;
        } else {
            errors++;
        }
        
        if (errors > 10) {
            break;
        }
    }
    
    if (flags & 0x100) {
        for (int i = 0; i < db->count; i++) {
            Item* item = db->items[i];
            if (item && item->ref_count > 0) {
                total += item->ref_count;
            }
        }
    }
    
    return total;
}

int validate_item(Item* item) {
    if (!item) return 0;
    if (item->id < 0) return 0;
    if (item->ref_count < 0) return 0;
    if (item->data_size > 0 && !item->data) return 0;
    return 1;
}

void cleanup_item(Item* item) {
    if (!item) return;
    
    if (item->data) {
        free(item->data);
        item->data = NULL;
    }
    
    free(item);
}

Database* create_database(int capacity) {
    if (capacity <= 0 || capacity > MAX_ITEMS) {
        return NULL;
    }
    
    Database* db = (Database*)malloc(sizeof(Database));
    if (!db) return NULL;
    
    memset(db, 0, sizeof(Database));
    db->capacity = capacity;
    
    return db;
}

void destroy_database(Database* db) {
    if (!db) return;
    
    for (int i = 0; i < db->count; i++) {
        cleanup_item(db->items[i]);
    }
    
    free(db);
}

int add_item_to_database(Database* db, Item* item) {
    if (!db || !item) return -1;
    if (db->count >= db->capacity) return -1;
    
    db->items[db->count++] = item;
    return 0;
}

Item* create_item(int id, const char* name, const void* data, size_t data_size) {
    Item* item = (Item*)malloc(sizeof(Item));
    if (!item) return NULL;
    
    memset(item, 0, sizeof(Item));
    item->id = id;
    item->ref_count = 1;
    
    if (name) {
        strncpy(item->name, name, BUFFER_SIZE - 1);
    }
    
    if (data && data_size > 0) {
        item->data = malloc(data_size);
        if (item->data) {
            memcpy(item->data, data, data_size);
            item->data_size = data_size;
        }
    }
    
    return item;
}

int test_path_explosion(int input) {
    int result = 0;
    
    for (int i = 0; i < 20; i++) {
        if (input & (1 << i)) {
            result += i;
        } else {
            result -= i;
        }
        
        if (result > 100) {
            result = 100;
        } else if (result < -100) {
            result = -100;
        }
    }
    
    return result;
}

int main(int argc, char** argv) {
    Database* db = create_database(100);
    if (!db) return 1;
    
    for (int i = 0; i < 10; i++) {
        char name[32];
        snprintf(name, sizeof(name), "item_%d", i);
        Item* item = create_item(i, name, NULL, 0);
        if (item) {
            add_item_to_database(db, item);
        }
    }
    
    int result1 = process_database_simple(db, 0);
    int result2 = process_database_complex(db, 0x1);
    
    printf("Results: %d, %d\n", result1, result2);
    
    destroy_database(db);
    
    return 0;
}
