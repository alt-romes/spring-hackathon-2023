#include <pthread.h>
#include <stdlib.h>
#include <arpa/inet.h>
#include <blue_dissemination.h>
#include <murmur3_hash.h>

#include <stdlib.h>

#define hashsize(n) ((uint64_t)1<<(n))
#define hashmask(n) (hashsize(n)-1)

blue_diss_t init(struct Config cfg) {
    blue_diss_t bd = malloc(sizeof(struct blue_diss));
    bd->in_flight = malloc(sizeof(struct msg) * IN_FLIGHT_SIZE);
    bd->count_in_flight = 0;

    // TODO: Check for errors...
    pthread_create(&bd->listening_thread, NULL, listen, (void*)bd);
    pthread_create(&bd->in_flight_thread, NULL, in_flight, (void*)bd);

    pthread_mutex_init(&bd->in_flight_lock, NULL);

    return bd;
}

/*
 * Listen to bluetooth connections and messages, if the message is new, trigger
 * a deliver and move it to the in-flight buffer which is processed by the in_flight thread.
 */
void* listen(void* bd_v) {
    blue_diss_t bd = (blue_diss_t)bd_v;
}

/*
 * Broadcast messages from the in-flight periodically until their time to live
 * is over.
 */
void* in_flight(void* bd_v) {
    int i;
    blue_diss_t bd = (blue_diss_t)bd_v;

    while (1) {

        // We copy all the messages pointers whose messages must be sent from the
        // in_flight list; we're the ones responsible for deleting them, so we can
        // be sure the're still alive.
        //
        // It might happen that if the in_flight_buffer is full, messages we're
        // currently holding are dropped from the buffer.  That's why, at the end,
        // we go over the buffer again, freeing the messages that were dropped from
        // the buffer or those whose time has run out.


        pthread_mutex_lock(bd->in_flight_lock);

        int count_in_flight_copy = bd->count_in_flight;
        msg_t* in_flight_copy[count_in_flight_copy];

        for (i=0; i<count_in_flight_copy; i++) {
            // TODO: Filter messages based on timestamps and modulos of things
            in_flight_copy[i] = bd->in_flight[i];
        }
        pthread_mutex_unlock(bd->in_flight_lock);

        for (i=0; i<count_in_flight_copy; i++) {
            // We've filtered messages to send above, we send them all here.
        }

        // TODO We need to check if any has been overwritten, and otherwise decrease TTL?
        // If things have been overwritten, or run out of time, we free them.
    }
}


/* Broadcast a message:
 * 
 * This will send one message to all nearby devices. It does not broadcast the
 * message more than once, unlike messages that are received by the nearby
 * devices running the application (see receive)
 */
int broadcast(blue_diss_t bd, msg_t* msg) {

    in_addr_t addrs[10];

    if (!blue_find(addrs, 10))
        return 2;

    for (int i = 0; i < 10; i++)
        blue_send(addrs[i], msg->buf, msg->size);

    int hash = MurmurHash3_x86_32(msg->buf, msg->size);
    bd->seen[hashmask(hash)] = hash;
    bd->in_flight[bd->count_in_flight++ % IN_FLIGHT_SIZE] = msg;

    return 0;
}

/* Receive a message:
 *
 * This is a blocking call (in the spirit of recv). It blocks waiting for new
 * messages and returns whenever a message is received from the
 * blue_dissemination network.
 */
int receive(blue_diss_t bd, msg_t* msg, size_t length) {
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

