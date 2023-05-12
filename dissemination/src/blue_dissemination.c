#include <arpa/inet.h>
#include <blue_dissemination.h>
#include <blue_dissemination.h>

#define hashsize(n) ((uint64_t)1<<(n))
#define hashmask(n) (hashsize(n)-1)

blue_diss_t* init(struct Config cfg) {
    blue_diss_t* bd = malloc(blue_diss_t);
    return bd;
}

int broadcast(blue_diss_t* bd, void* msg, size_t size) {

    int size;
    in_addr_t* addrs;

    if (blue_find(&addrs, &size))
        return 2;

    for (int i = 0; i < size; i++)
        blue_send(addrs[i], msg);

    int hash = MurmurHash3_x86_32(msg, size);
    bd->seen[hashmask(hash)] = hash;
    bd->in_flight

    return 0;
}

int receive(blue_diss_t* bd, void** msg, int* size) {
    return 0;
}

