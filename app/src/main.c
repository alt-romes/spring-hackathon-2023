#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

extern char *optarg;
extern int optind, opterr, optopt;
int main(int argc, char *argv[])
{
    if (argc == 1)
    {
        printf("Program usage:\n\tpropagate [-b \"path_to_file\"|-p]");
    }
    int c = 0;
    int pflag = 0;
    char *path = NULL;

    opterr = 0;

    while ((c = getopt(argc, argv, "pb:")) != -1)
        switch (c)
        {
        case 'p':
            pflag = 1;
            break;
        case 'b':
            path = optarg;
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
    return 0;
}