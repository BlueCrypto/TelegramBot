//index.js

var requestApi = require("./requestApi"),
  bluebot = require("./bluebot");
var totalSwaps;
var totalBlueSwapped;
var modifier = 4;
var balance;


requestApi();

bluebot();
