

var hovered_piece = null;
var selected_piece = null;
var selected_piece_color = null;
var play_made = false; //Made a play, have to wait for response

var old_selected_piece;
var new_selected_piece;

// Join
if(localStorage.getItem("uuid") === null)
    localStorage.setItem("uuid", uuid());

// Join will set things correctly, whether it's an old join or a returning join
join(localStorage.getItem("uuid"));

// Board setup (clean state)
paintBoardBW();
// Set hover event listeners on all squares
const hovercolor = 'blue';
for (const tr of board.children[0].children) {
    for (const th of tr.children) {
        th.onmouseleave = function () {
            this.style.background = this.dataset.selected == "true" ? 'pink' : this.dataset.color;
        }
        th.onmouseover = function() {
            this.style.background = this.dataset.selected == "true" ? 'pink' : hovercolor;
        }
        th.onclick = function() {
            if (board.dataset.selected.length < 3) {
                board.dataset.selected += this.id;
                this.dataset.selected = true;
            }
            if (board.dataset.selected.length >= 4)
                vote(attempt_move(board.dataset.selected[0]+board.dataset.selected[1],board.dataset.selected[2]+board.dataset.selected[3]),localStorage.getItem("uuid"));
                // The board selected will be updated on board according to the votes
        }
    }
}

function populateTopmovesTable(moves) {

    var data = moves;
    if(moves == undefined){
        data = [];
    }

    var tableBody = document.getElementById('topmovestable');

    //var num_new_adittions = data.length;

    /*for (const c of tableBody.children) {
        if(tableBody.children.length > 0) {
            var last_index = tableBody.children.length - 1;
            tableBody.removeChild(tableBody.children[last_index]);
        }
    }*/
    tableBody.innerHTML = '';

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


// document.addEventListener('click', onclick_anywhere, false);

function uuid() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
