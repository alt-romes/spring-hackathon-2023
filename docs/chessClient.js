let team = "";
function get_board() {
    getGetBoard((okData) =>{
        console.log(okData)
        parse_fen(okData)
    },(errData) =>{console.log("Error getting board\nerrData:" + errData)})

}
function join() {
    const id= new Uint8Array(8);
    let id_as_str = ""
    crypto.getRandomValues(id);
    for(let i = 0; i<id.length;i++){
        id_as_str =id_as_str.concat(id[i].toString())     
    }
    console.log(id_as_str)
    postJoin({UserId:""+id},(okData)=>{console.log("Success,Assigning team as" + okData);team=okData},(errData)=>{console.log("Error")})
}
function vote(move, id) {
    console.log(move)
    postVote({PlyText:move},
        (okData) =>{console.log("Success submiting vote.\nMove submited:" +move)},
        (errData)=>{console.log("Error voting");reset_state()})
}