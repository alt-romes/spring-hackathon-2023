//White is 0, Black is 1

function get_board() {
    fetch("/getBoard").then((data)=>{
        if(data.status == 200){
            parse_fen(data.body);
        }else{
            console.log("Error getting board");
        }

    })

}
function id() {
    //GET TEAM FROM SERVER
    postData("/join?id="+id,).then((data) => {
        if (data.status == 200) {
            if (data.body == 'white') {
                team = 0;
            } else {
                team = 1;
            }
        } else {
            console.log("Error assigning team. /join no success");
        }
    });
}
function vote(move, id) {
}
var team = 0;