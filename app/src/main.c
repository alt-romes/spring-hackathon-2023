#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include "../../dissemination/include/blue_dissemination.h"

extern char *optarg;
extern int optind, opterr, optopt;
size_t bufSize = 1024;
int peerCycle(blue_diss_t* diss){
    while(1){
        msg_t* toRedirect = alloc_msg(bufSize);
        int err = receive(diss,toRedirect);
        if(err){
            fprint(stderr,"Error occurred while receiving msg\n");
            break;
        }
        printf("Message received: %s\n",toRedirect->buf);
    }
}
int castCycle(blue_diss_t* diss,char* msg){
    while(1){
        msg_t* toSend= alloc_msg(bufSize);
        toSend->buf = msg;
        int err = broadcast(diss,toSend);
        if(err){
            fprintf(stderr,"Error occurred while broadcasting %s",toSend);
            break;
        }
    }
}
int main(int argc, char *argv[])
{
    if (argc == 1)
    {
        printf("Program usage:\n\tpropagate [-b \"msg\"|-p]\n");
    }
    int c = 0;
    int pflag = 0;
    char *msg = NULL;

    opterr = 0;

    while ((c = getopt(argc, argv, "pb:")) != -1)
        switch (c)
        {
        case 'p':
            pflag = 1;
            printf("Acting as peer.\n");
            break;
        case 'b':
            msg = optarg;
            printf("Broadcasting %s\n",msg);
            break;
        case '?':
            if (optopt == 'b')
                fprintf(stderr, "Option -b requires an argument.\n");
            else if (isprint(optopt))
                fprintf(stderr, "Unknown option `-%c'.\n", optopt);
            else
                fprintf(stderr,
                        "Unknown option character `\\x%x'.\n",
                        optopt);
            return 1;
        default:
            abort();
        }
    if(msg!=NULL && pflag==1){
        fprintf(stderr,"Only one flag can be set. Either p or b\n");
        return 1;
    }
    struct Config cfg;
    blue_diss_t* diss = init(cfg);
    if(pflag){
        //Acting as peer
        int resp = peerCycle(diss);
    }else{
        //Acting as broadcaster
        int resp = castCycle(diss,msg);
    }
    return 0;
}