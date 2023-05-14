
var timeInterval = 5000;

var intervalId = setInterval(function() {
  get_board();

  
  playingteam = get_playing_team();
  timeleft = get_time_left();

}, timeInterval);
