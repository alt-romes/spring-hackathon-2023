let team = "";

function get_board() {
    getBoard((okData) =>{
        console.log(okData)
        parse_fen(okData)
    },(errData) =>{console.log("Error getting board\nerrData:");console.log(errData)})

}
function join(uuid) {
    postJoin(uuid,(okData)=>{console.log("Success,Assigning team as" + okData);team=okData},(errData)=>{console.log("Error")})
}
function vote(move, id) {
    console.log(move)
    postVote({uid:id,ply:move},
        (okData) =>{console.log("Success submiting vote.\nMove submited:" +move)},
        (errData)=>{console.log("Error voting");reset_state()})
}
document.addEventListener('DOMContentLoaded',get_board,false);
