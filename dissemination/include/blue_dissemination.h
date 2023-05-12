#ifndef BLUE_DISSEMINATION_H
#define BLUE_DISSEMINATION_H

typedef struct blue_diss {
    void** in_flight; // messages we're still periodically broadcasting
    int*   seen;      // hashes of messages we've seen recently
} blue_diss_t;

struct Config {

};

blue_diss_t* init(struct Config);

int broadcast(blue_diss_t*, void* msg);

int receive(blue_diss_t*, void* msg, int count);


// Stubs

int blue_find(in_addr_t*, int);
int blue_send(in_addr_t*, void*);

#endif
