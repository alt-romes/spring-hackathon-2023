

var hovered_piece = null;
var selected_piece = null;
var selected_piece_color = null;

document.addEventListener('DOMContentLoaded', function() {
    hovered_piece = null;
    selected_piece = null;

    //On load
    var board = document.getElementById('table');
    
    var last = true;
    var color_white = 'white';
    var color_black = 'lightblue';
    for (const tr of board.children[0].children) {
        //Each tr
        last = !last;
        var hovercolor;
        for (const th of tr.children) {
            if(last) {
                th.style.background = color_white;
                th.style.backgroundcolor = color_white;
                hovercolor = 'green';
                last = false;
                th.onmouseleave = function() {
                    if(this.id != selected_piece) 
                        this.style.background = color_white;
                    hovered_piece = null;
                }
            } else {
                th.style.background = color_black;
                th.style.backgroundcolor = color_black;
                hovercolor = 'blue';
                last = true;
                th.onmouseleave = function() {
                    if(this.id != selected_piece) 
                        this.style.background = color_black;
                    hovered_piece = null;

                }
            }

            th.onmouseover = function() {
                hovered_piece = this.id;

                if(selected_piece != null && this.id == selected_piece) 
                    this.style.background = 'pink';
                else
                    this.style.background = hovercolor;
            }
        }
    }

}, false);


function callback(e) {
    if(hovered_piece != null) {
        var piece;
        piece = document.getElementById(selected_piece);

        if(selected_piece != null) {
            piece.style.background = piece.style.backgroundcolor;
        } 


        //Get newly selected piece
        piece = document.getElementById(hovered_piece);

        if(piece != null) {
            character = piece.innerHTML;
            if(character == 'ㅤ')  {
                //Not a piece, abort
                return;
            }
        }
        selected_piece = hovered_piece;
        selected_piece_color = piece.style.background;
        piece.style.background = 'pink';

    }
}


if (document.addEventListener) {
    document.addEventListener('click', callback, false);
} else {
    document.attachEvent('onclick', callback);
}
