const board      = document.querySelector("#table") // alias..
const error_html = document.querySelector("#error")
const error_wrapper = document.querySelector("#error-wrapper")
const playing_html = document.querySelector("#playingteam")
const time_left_html = document.querySelector("#timeswitch")
const team_html = document.querySelector("#myteam")
const stat_html = document.querySelector("#gstatus")

// Paint Black and White squares
board.dataset.selected = "";
function paintBoardBW() {
    let bOrW = true;
    var color_white = 'white';
    var color_black = 'lightblue';
    for (const tr of board.children[0].children) {
        //Each tr
        bOrW = !bOrW;
        for (const th of tr.children) {
            bOrW = !bOrW // cross pattern -- that's why we do it twice
            let paint_color = bOrW ? color_white : color_black;
            th.style.background      = paint_color;
            th.style.backgroundcolor = paint_color;
            th.dataset.color         = paint_color;
            th.dataset.selected      = false;
        }
    }
}

function update_board() {
    getBoard((okData) =>{

        console.log(okData)
        console.log(board.dataset.position)

        if (board.dataset.position != okData) {
            console.log("Updating board!")

            // Parse and update board
            parse_fen_and_update(okData)

            // Clear board
            paintBoardBW();

            // Clear play
            board.dataset.selected = "";
            
            // Update position
            board.dataset.position = okData;
        }

    }, displayError)
}

function join(uuid) {
    postJoin(uuid,(okData)=>{
        console.log("Success,Assigning team as " + okData);
        team_html.innerHTML = okData;
        team_html.dataset.value = okData;
    }, err => {
        // On join failure, we don't display the error if it's a previously joined error, we simply take the team
        console.log(err);
        let errWords = err.split(" ");
        let errTeam = errWords[errWords.length-1]
        if (errTeam == "Black" || errTeam == "White") {
            console.log("Already has team: " + errTeam);
            team_html.innerHTML = errTeam;
            team_html.dataset.value = errTeam;
        }
        else {
            displayError(err);
        }
    })
}

function vote(move, id) {
    console.log(move)
    postVote({uid:id,ply:move},
        (okData) =>{
            console.log("Success submiting vote.\nMove submited:" +move)
        },
        err => {
            displayError(err);
            if (board.dataset.selected.length < 4) // If move is set, errors after don't unset this.
                paintBoardBW(); // Clear highlights/plays
        }
    )
}

function getTopMoves(){
    getTopvotesByN(5,(okData)=>{
        console.log(okData)
        populateTopmovesTable(okData)
    },displayError)
}

function update_playing_team() {

    getPlaying(
        (okData) => {
            playing_html.innerHTML = okData;

            myteam = team_html.dataset.value;

            var waiting = myteam != okData;

            if(waiting) {
                stat_html.textContent = "Wait for next move";
                stat_html.style.color = "red";
            }
            else {
                stat_html.textContent = "Suggest Move";
                stat_html.style.color = "green";
            }
        },
        displayError
    );

}

function update_time_left() {

    getTimeleft(

        (okData) =>{
            // ROMES:TODO: Floor or Ceil? How to round is the question.
            time_left_html.innerHTML = (Math.ceil(parseFloat(okData)/60)) + " minutes";
        }, // TODO: this should be interpolated by the frontend or something
        displayError
    );

}

function displayError(errData) {
    error_html.innerHTML = errData;
    error_wrapper.hidden = false;
    setTimeout(() => {
        error_html.innerHTML = "";
        error_wrapper.hidden = true;
    }, 4000)
}

