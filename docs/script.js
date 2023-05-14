

var hovered_piece = null;
var selected_piece = null;
var selected_piece_color = null;
var play_made = false; //Made a play, have to wait for response

var old_selected_piece;
var new_selected_piece;

const board = document.getElementById('table');

window.onload = () => {

    if(localStorage.getItem("uuid") === null)
        localStorage.setItem("uuid", uuid());

    // Join will set things correctly, whether it's an old join or a returning join
    join(localStorage.getItem("uuid"));
}

document.addEventListener('DOMContentLoaded', start_state, false);

function start_state() {
    hovered_piece = null;
    selected_piece = null;

    populateTopmovesTable();

    old_selected_piece = null;
    new_selected_piece = null;
    

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


function onclick_anywhere(e) {
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
            vote(attempt_move(old_selected_piece,new_selected_piece),localStorage.getItem("uuid"));
        }

    }

    if(hovered_piece == null) {
        console.log("Clicked out!");
    }

}

function populateTopmovesTable() {

    var data = [
        { place: 1, move: "a3d4", number: 1 },
        //{ place: 2, move: "b3c2", number: uuid() },
        //{ place: 3, move: "d3e2", number: 3 },
    ];

    var tableBody = document.getElementById('topmovestable');
    var max = 5;

    var num_new_adittions = data.length;

    for (const c of tableBody.children) {
        if(tableBody.children.length + num_new_adittions > max && tableBody.children.length > 0) {
            var last_index = tableBody.children.length - 1;
            tableBody.removeChild(tableBody.children[last_index]);
        }
    }

    // Loop through the data and create table rows dynamically
    for (var i = 0; i < data.length; i++) {
        var row = document.createElement('tr');
        
        var placeCell = document.createElement('td');
        placeCell.textContent = data[i].place;
        row.appendChild(placeCell);

        var moveCell = document.createElement('td');
        moveCell.textContent = data[i].move;
        row.appendChild(moveCell);

        var numberCell = document.createElement('td');
        numberCell.textContent = data[i].number;
        row.appendChild(numberCell);

        //tableBody.appendChild(row);
        tableBody.insertBefore(row, tableBody.firstChild);
    }
}


document.addEventListener('click', onclick_anywhere, false);

function uuid() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
