#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/socket.h>
#include <bluetooth/bluetooth.h>
#include <bluetooth/hci.h>
#include <bluetooth/hci_lib.h>
#include <bluetooth/rfcomm.h>
#include <errno.h>

int search() {
    inquiry_info *ii = NULL;
    int max_rsp, num_rsp;
    int dev_id, sock, len, flags;
    int i;
    char addr[19] = { 0 };
    char name[248] = { 0 };

    dev_id = hci_get_route(NULL);
    sock = hci_open_dev(dev_id);
    if (dev_id < 0 || sock < 0) {
        perror("opening socket");
        exit(1);
    }

    len = 8;
    max_rsp = 255;
    //flags = IREQ_CACHE_FLUSH;
    flags = 0;
    ii = (inquiry_info*) malloc(max_rsp * sizeof(inquiry_info));
    
    num_rsp = hci_inquiry(dev_id, len, max_rsp, NULL, &ii, flags);
    if(num_rsp < 0)
        perror("hci_inquiry");

    printf("Found %d devices\n", num_rsp);

    for (i = 0; i < num_rsp; i++) {
        ba2str(&(ii+i)->bdaddr, addr);
        memset(name, 0, sizeof(name));
        if (hci_read_remote_name(sock, &(ii+i)->bdaddr, sizeof(name), 
            name, 0) < 0)
        strcpy(name, "[unknown]");
        printf("%s %s\n", addr, name);
    }

    free(ii);
    close(sock);
}



int dynamic_bind_rc(int sock, struct sockaddr_rc *sockaddr, uint8_t *port) {
    int err;
    for( *port = 1; *port <= 31; *port++ ) {
        sockaddr->rc_channel = *port;
        err = bind(sock, (struct sockaddr *)sockaddr, sizeof(sockaddr));
        if( !err || errno == EINVAL ) break;
    }
    if( *port == 31 ) {
        err = -1;
        errno = EINVAL;
    }
    return err;
}

int server() {
    struct sockaddr_rc loc_addr = { 0 }, rem_addr = { 0 };
    char buf[1024] = { 0 };
    int s, client, bytes_read;
    socklen_t opt = sizeof(rem_addr);

    // allocate socket
    s = socket(AF_BLUETOOTH, SOCK_STREAM, BTPROTO_RFCOMM);

    // bind socket to port 1 of the first available 
    // local bluetooth adapter
    loc_addr.rc_family = AF_BLUETOOTH;
    loc_addr.rc_bdaddr = *BDADDR_ANY;
    loc_addr.rc_channel = (uint8_t) 1;
    //bind(s, (struct sockaddr *)&loc_addr, sizeof(loc_addr));
    uint8_t port;
    dynamic_bind_rc(s, &loc_addr, &port);
    fprintf(stderr, "binded %d socket to port %d\n", s, port);

    // put socket into listening mode
    listen(s, 1);

    // accept one connection
    client = accept(s, (struct sockaddr *)&rem_addr, &opt);

    ba2str( &rem_addr.rc_bdaddr, buf );
    fprintf(stderr, "accepted connection from %s\n", buf);
    memset(buf, 0, sizeof(buf));

    // read data from the client
    bytes_read = read(client, buf, sizeof(buf));
    if( bytes_read > 0 ) {
        printf("received [%s]\n", buf);
    }

    // close connection
    close(client);
    close(s);
    return 0;
}

int client(char *dest) {
    struct sockaddr_rc addr = { 0 };
    int s, status;
    //char dest[18] = "01:23:45:67:89:AB";
    printf("Trying to connect to %s\n", dest);

    // allocate a socket
    s = socket(AF_BLUETOOTH, SOCK_STREAM, BTPROTO_RFCOMM);

    // set the connection parameters (who to connect to)
    addr.rc_family = AF_BLUETOOTH;
    addr.rc_channel = (uint8_t) 1;
    str2ba( dest, &addr.rc_bdaddr );

    // connect to server
    status = connect(s, (struct sockaddr *)&addr, sizeof(addr));

    // send a message
    if( status == 0 ) {
        status = write(s, "hello!", 6);
    }

    if( status < 0 ) perror("uh oh");

    close(s);
    return 0;
}

int main(int argc, char **argv) {
    int opt;

    while((opt = getopt(argc, argv, "isc:")) != -1) {
	    switch(opt) {
            case 'i':
	            search();
	    		break;
            case 's':
	            server();
	    		break;
            case 'c':
	            client(optarg);
	    		break;

	        default:
	    		break;
	    }
	}

    return 0;
}
