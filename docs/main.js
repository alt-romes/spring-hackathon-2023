const timeInterval = 5000;

setInterval(() => {

    update_board();
    update_playing_team();
    update_time_left();

    // if(lastBoard != res && !was_error)
    //     reset_state();

    // if(was_error)
    //     alert("Error: " + res);

}, timeInterval);

update_board();
update_playing_team();
update_time_left();
