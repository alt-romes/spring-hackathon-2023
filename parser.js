function parse_fen(string) {
    currPos = [0, 0]
    for (const c of string) {
        switch (c) {
            case 'r':
                drawPiece('♖', currPos);
                currPos[1]++;
                break;
            case 'p':
                drawPiece('♙', currPos);
                currPos[1]++;
                break;
            case 'q':
                drawPiece('♕', currPos);
                currPos[1]++;
                break;
            case 'k':
                drawPiece('♔', currPos);
                currPos[1]++;
                break;
            case 'n':
                drawPiece('♘', currPos);
                currPos[1]++;
                break;
            case 'b':
                drawPiece('♗', currPos);
                currPos[1]++;
                break;
            case 'R':
                drawPiece('♜',currPos);
                currPos[1]++;
                break;
            case 'Q':
                drawPiece('♛',currPos);
                currPos[1]++;
                break;
            case 'P':
                drawPiece('♟︎',currPos);
                currPos[1]++;
                break;
            case 'B':
                drawPiece('♝',currPos);
                currPos[1]++;
                break;
            case 'N':
                drawPiece('♞',currPos);
                currPos[1]++;
                break;
            case 'K':
                drawPiece('♚',currPos);
                currPos[1]++;
                break;
            case '/':
                currPos[0]++;
                currPos[1] = 0;
                break;
            case ' ':
                parse_header(string);
                return;
            default:
                num = parseInt(c);
                currPos[0] += num;
                break;
        }
    }
}
function drawPiece(piece, coords) {
    let piece_elem = document.getElementById(coords[0] + "" + coords[1]);
    piece_elem.innerText = piece;


}
function parse_header(string) {
    let split_header = string.split(" ");
    let last_move = split_header[1];
    let castling = split_header[2];
    let en_passant = split_header[3];
}