
var selected_piece;

document.addEventListener('DOMContentLoaded', function() {
    //On load
    var board = document.getElementById('table');
    console.log(board)
    
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
                hovercolor = 'green';
                last = false;
                th.onmouseleave = function() {
                    this.style.background = color_white;
                }
            } else {
                th.style.background = color_black;
                hovercolor = 'blue';
                last = true;
                th.onmouseleave = function() {
                    this.style.background = color_black;
                }
            }

            th.onmouseover = function() {
                this.style.background = hovercolor;
            }
        }
    }

}, false);


