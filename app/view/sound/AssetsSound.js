var BALLOON_1 = 0;
var BALLOON_2 = 1;
var BALLOON_3 = 2;
var BALLOON_4 = 3;
var BACKGROUND_NORMAL = 4;
var BACKGROUND_SUCCESS = 5;

var Sounds = {};

Sounds[BALLOON_1] = {
  src: 'assets/sounds/balloon1.wav',
  loop: false,
  volume: 1
};

Sounds[BALLOON_2] = {
  src: 'assets/sounds/balloon2.wav',
  loop: false,
  volume: 1
};

Sounds[BALLOON_3] = {
  src: 'assets/sounds/balloon3.wav',
  loop: false,
  volume: 1
};

Sounds[BALLOON_4] = {
  src: 'assets/sounds/balloon4.wav',
  loop: false,
  volume: 1
};

Sounds[BACKGROUND_NORMAL] = {
  src: 'assets/sounds/background.wav',
  loop: true,
  volume: 1
};

Sounds[BACKGROUND_SUCCESS] = {
  src: 'assets/sounds/background-success.wav',
  loop: true,
  volume: 1
};

module.exports = {
  BALLOON_1: BALLOON_1,
  BALLOON_2: BALLOON_2,
  BALLOON_3: BALLOON_3,
  BALLOON_4: BALLOON_4,
  BACKGROUND_NORMAL: BACKGROUND_NORMAL,
  BACKGROUND_SUCCESS: BACKGROUND_SUCCESS,

  Sounds: Sounds
};
