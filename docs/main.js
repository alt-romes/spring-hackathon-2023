
var timeInterval = 5000;

var lastBoard = "";



var intervalId = setInterval(function() {
    get_board();

    if(lastBoard != res)
        reset_state();

    lastBoard = res;

    playingteam = get_playing_team();
    timeleft = get_time_left();
    
}, timeInterval);
