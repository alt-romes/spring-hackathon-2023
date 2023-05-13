
document.addEventListener('DOMContentLoaded', function() {
    //On load
    var board = document.getElementById('table');
    console.log(board)
    
    var last = true;
    var last_row = true;
    for (const tr of board.children[0].children) {
        //Each tr
        if(last_row) {
            last = !last;
        }
        for (const th of tr.children) {
            console.log(th);
            if(last) {
                th.style.background = 'white';
                last = false;
            } else {
                th.style.background = 'darkcyan';
                last = true;
            }
        }
    }

}, false);


