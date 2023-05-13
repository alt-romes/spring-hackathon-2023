#ifndef BLUE_DISSEMINATION_H
#define BLUE_DISSEMINATION_H

#include <pthread.h>
#include <arpa/inet.h>

#define IN_FLIGHT_SIZE 32

typedef struct msg {
    size_t size;
    char*  buf;
    int timestamp;
} msg_t;

typedef struct blue_diss {

    // messages we're still periodically broadcasting
    msg_t* in_flight[IN_FLIGHT_SIZE];
    int count_in_flight;
    pthread_mutex_t in_flight_lock;

    // hashes of messages we've seen recently (indexed by hashmask(hash)!)
    int* seen;

    // listening thread
    pthread_t listening_thread;
    pthread_t in_flight_thread;

} * blue_diss_t;

struct Config {
    int period; // broadcast every x seconds
    int dead_after; // dead after x seconds
};

blue_diss_t init(struct Config);

int broadcast(blue_diss_t, msg_t* msg);

int receive(blue_diss_t, msg_t* msg);

msg_t* alloc_msg(size_t size);

void free_msg(msg_t* msg);

// Stubs

int blue_find(in_addr_t*, size_t);
int blue_send(in_addr_t, char*, size_t);

#endif
