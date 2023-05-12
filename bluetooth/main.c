#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/socket.h>
#include <bluetooth/bluetooth.h>
#include <bluetooth/hci.h>
#include <bluetooth/hci_lib.h>
#include <bluetooth/rfcomm.h>
#include <bluetooth/l2cap.h>
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
    struct sockaddr_l2 loc_addr = { 0 }, rem_addr = { 0 };
    char buf[1024] = { 0 };
    int s, client, bytes_read;
    socklen_t opt = sizeof(rem_addr);

    // allocate socket
    s = socket(AF_BLUETOOTH, SOCK_SEQPACKET, BTPROTO_L2CAP);

    // bind socket to port 0x1001 of the first available 
    // bluetooth adapter
    loc_addr.l2_family = AF_BLUETOOTH;
    loc_addr.l2_bdaddr = *BDADDR_ANY;
    loc_addr.l2_psm = htobs(0x1001);

    bind(s, (struct sockaddr *)&loc_addr, sizeof(loc_addr));

    // put socket into listening mode
    listen(s, 1);

    // accept one connection
    client = accept(s, (struct sockaddr *)&rem_addr, &opt);

    ba2str(&rem_addr.l2_bdaddr, buf);
    fprintf(stderr, "accepted connection from %s\n", buf);

    memset(buf, 0, sizeof(buf));

    // read data from the client
    bytes_read = read(client, buf, sizeof(buf));
    if(bytes_read > 0) {
        printf("received [%s]\n", buf);
    }

    // close connection
    close(client);
    close(s);
}

int client(char *destination) {
    struct sockaddr_l2 addr = { 0 };
    int s, status;
    char *message = "hello!";
    char dest[18];
    strncpy(dest, destination, 18);

    // allocate a socket
    s = socket(AF_BLUETOOTH, SOCK_SEQPACKET, BTPROTO_L2CAP);

    // set the connection parameters (who to connect to)
    addr.l2_family = AF_BLUETOOTH;
    addr.l2_psm = htobs(0x1001);
    str2ba(dest, &addr.l2_bdaddr);

    // connect to server
    printf("Trying to connect to %s\n", dest);
    status = connect(s, (struct sockaddr *)&addr, sizeof(addr));

    // send a message
    if(status == 0) {
        status = write(s, message, strlen(message));
    }

    if(status < 0)
        perror("uh oh");
    else
        printf("Message sent successfuly\n");

    close(s);
}

int main(int argc, char **argv) {
    int opt;

    while((opt = getopt(argc, argv, "isc:")) != -1) {
	    switch(opt) {
            case 'i':
	            search();
	    		goto stop;
            case 's':
	            server();
	    		goto stop;
            case 'c':
	            client(optarg);
	    		goto stop;
	        default:
	    		break;
	    }
	}
stop:

    return 0;
}
