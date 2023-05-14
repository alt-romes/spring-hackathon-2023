const timeInterval = 1000;

setInterval(() => {

    update_board();
    update_playing_team();
    update_time_left();
    getTopMoves();

}, timeInterval);

update_board();
update_playing_team();
update_time_left();
