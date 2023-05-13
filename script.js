

var hovered_piece = null;
var selected_piece = null;
var selected_piece_color = null;
var play_made = false; //Made a play, have to wait for response


var old_selected_piece;
var new_selected_piece;

document.addEventListener('DOMContentLoaded', start_state, false);

function start_state() {
    hovered_piece = null;
    selected_piece = null;

    old_selected_piece = null;
    new_selected_piece = null;

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
                    if(this.id != selected_piece &&
                       this.id != new_selected_piece &&
                       this.id != old_selected_piece)
                        this.style.background = color_white;

                    hovered_piece = null;
                }
            } else {
                th.style.background = color_black;
                th.style.backgroundcolor = color_black;
                hovercolor = 'blue';
                last = true;
                th.onmouseleave = function() {
                    if(this.id != selected_piece &&
                       this.id != new_selected_piece &&
                       this.id != old_selected_piece)
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

}

function reset_state() {
    start_state(); 
    play_made = false;
}


function callback(e) {
    old_selected_piece = selected_piece;
    
    //Check background coloring
    if(hovered_piece != null && !play_made) {
        var piece;
        piece = document.getElementById(selected_piece);

        if(old_selected_piece == null && selected_piece != null) {
            piece.style.background = piece.style.backgroundcolor;
        } 


        //Get newly selected piece
        piece = document.getElementById(hovered_piece);

        if(piece != null) { //Hovered some piece
            character = piece.innerHTML;
            //First selected piece
            if(character != 'ㅤ' && old_selected_piece == null)  {
                //Not a piece
                selected_piece_color = piece.style.background;
                piece.style.background = 'pink';

                selected_piece = hovered_piece;
                new_selected_piece = selected_piece;
            }

            if(old_selected_piece != null)  {
                piece.style.background = 'pink';

                new_selected_piece = hovered_piece;
                selected_piece = null;
            }

        }


        if(old_selected_piece != null) {
            console.log("Made move, from " + old_selected_piece + " to " + new_selected_piece);
            selected_piece = null;
            play_made = true;
        }

    }

    if(hovered_piece == null) {
        console.log("Clicked out!");
        reset_state();
    }

}


if (document.addEventListener) {
    document.addEventListener('click', callback, false);
} else {
    document.attachEvent('onclick', callback);
}
