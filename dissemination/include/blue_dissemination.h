#ifndef BLUE_DISSEMINATION_H
#define BLUE_DISSEMINATION_H

#include <arpa/inet.h>

typedef struct blue_diss {
    msg in_flight[32]; // messages we're still periodically broadcasting
    int count_in_flight;
    int*   seen;      // hashes of messages we've seen recently
} blue_diss_t;

typedef struct msg {
    size_t size;
    char*  buf;
} msg_t;

struct Config {

};

blue_diss_t* init(struct Config);

int broadcast(blue_diss_t*, char* msg);

int receive(blue_diss_t*, char* msg, int count);

msg_t * alloc_msg(size_t size);

void free_msg(msg_t * msg);

// Stubs

int blue_find(in_addr_t*, int);
int blue_send(in_addr_t*, void*);

#endif
