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

async function postData(url = "", data = {},params = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }