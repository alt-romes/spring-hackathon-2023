const board_html = document.querySelector("#table")
const error_html = document.querySelector("#error")
const playing_html = document.querySelector("#playingteam")
const time_left_html = document.querySelector("#timeswitch")
const team_html = document.querySelector("#myteam")
const stat_html = document.querySelector("#gstatus")

function update_board() {
    getBoard((okData) =>{

        console.log(okData)

        if (board_html.dataset.position != okData)
            parse_fen_and_update(okData)

    }, displayError)
}

function join(uuid) {
    postJoin(uuid,(okData)=>{
        console.log("Success,Assigning team as" + okData);
        team_html.innerHTML = okData;
        team_html.dataset.value = okData;
    }, displayError)
}

function vote(move, id) {
    console.log(move)
    postVote({uid:id,ply:move},
        (okData) =>{
            console.log("Success submiting vote.\nMove submited:" +move)
        },
        displayError
    )
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

        (okData) =>{ time_left_html.innerHTML = okData + " seconds" }, // TODO: this should be interpolated by the frontend or something
        displayError
    );

}

/* Util */

function displayError(errData) {
        error_html.innerHTML = errData
        setTimeout(() => error_html.innerHTML = "", 3000)
}

