#ifndef BLUE_DISSEMINATION_H
#define BLUE_DISSEMINATION_H
#endif

struct Config {

};

int init(struct Config);

int broadcast(void* msg);

int receive(void** msg, int* size);



