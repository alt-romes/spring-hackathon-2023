#include <stdlib.h>
#include <arpa/inet.h>
#include <blue_dissemination.h>
#include <murmur3_hash.h>

#include <stdlib.h>

#define hashsize(n) ((uint64_t)1<<(n))
#define hashmask(n) (hashsize(n)-1)

blue_diss_t* init(struct Config cfg) {
    blue_diss_t* bd = malloc(sizeof(blue_diss_t));
    return bd;
}

int broadcast(blue_diss_t* bd, msg_t msg) {

    in_addr_t addrs[10];

    if (!blue_find(addrs, 10))
        return 2;

    for (int i = 0; i < 10; i++)
        blue_send(addrs[i], msg.buf, msg.size);

    int hash = MurmurHash3_x86_32(msg.buf, msg.size);
    bd->seen[hashmask(hash)] = hash;
    bd->in_flight[bd->count_in_flight++ % IN_FLIGHT_SIZE] = msg;

    return 0;
}

int receive(blue_diss_t* bd, msg_t msg) {
    return 0;
}

msg_t * alloc_msg(size_t size)
{
    return (msg_t *) malloc(sizeof(msg_t) + size);
}

void free_msg(msg_t * msg)
{
    free(msg);
}

