//requestApi.js
const fetch = require("node-fetch");
var Datastore = require("nedb"),
  eventDB = new Datastore({ filename: "event_db", autoload: true });
eventDB.loadDatabase();
eventsDB = new Datastore({ filename: "events_db", autoload: true });
eventsDB.loadDatabase();

// byz chat ID -1001435661947
// blue chat ID -1001108272084

//SET CHAT IDS
const chatIDs = [-1001108272084,-1001435661947];  
 

const dotenv = require("dotenv");
dotenv.config();
const token = process.env.BLUE_BOT_API_KEY;



function numberWithCommas(x) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function requestApi() {
  setInterval(function() {
    fetch("https://api.byz.network/api/allEvents")
      .then(function(response) {
        return response.json();
      })
      .then(function(myJson) {
        myJson = JSON.stringify(myJson);
        var objects = JSON.parse(myJson);
        var objectArray = [];
        let i = -1;

        eventDB.findOne({}, function(err, doc) {
          if (err != undefined || doc == null) {
            console.log(err);
          } else {
            let numberOfSwapsFromDatabase = doc.numberOfSwaps + 1;
            console.log("Numer of events in the database: " + doc.numberOfSwaps);
            (function checkSwaps() {
              if (objects[numberOfSwapsFromDatabase]) {
                console.log("Found a new event");
                let amt = parseFloat(objects[numberOfSwapsFromDatabase].amt / 10 ** 8).toFixed(0);
                let totalSwapped = parseFloat(objects[numberOfSwapsFromDatabase].totalSwapped / 10 ** 8).toFixed(0);

                if (objects[numberOfSwapsFromDatabase + 1]) {
                  let totalSwapped = parseFloat(objects[numberOfSwapsFromDatabase + 1].totalSwapped / 10 ** 8).toFixed(0);
                }

                eventDB.update(
                  { id: 0 },
                  {
                    $inc: { numberOfSwaps: 1 }
                  },

                  function(err, numReplaced) {}
                );

                eventsDB.insert(
                  [
                    {
                      id: objects[numberOfSwapsFromDatabase].id,
                      blockNum: objects[numberOfSwapsFromDatabase].blockNum,
                      amt: numberWithCommas(amt),
                      ethAddress: objects[numberOfSwapsFromDatabase].ethAddress,
                      byzAddress: objects[numberOfSwapsFromDatabase].byzAddress,
                      totalSwapped: numberWithCommas(totalSwapped)
                    }
                  ],
                  function() {}
                );
                let byzAdressFormatted = objects[numberOfSwapsFromDatabase].byzAddress.substring(0, 5) + "(...)" + objects[numberOfSwapsFromDatabase].byzAddress.substring(33, 37);
                let modifier;
                objects[numberOfSwapsFromDatabase].blockNum > 8493121 ? (modifier = 4) : (modifier = 5);
                  console.log("Modifier is " + modifier + " . Pushing message to all chats.");
                chatIDs.forEach(function(entry) {
                  fetch("https://api.telegram.org/bot" + token + "/sendMessage?parse_mode=markdown&chat_id=" + entry + "&disable_web_page_preview=1&text=Someone just swapped some BLUE \n_" + byzAdressFormatted + "_ is richer by *" + numberWithCommas(amt * modifier) + "BYZ*!\nTotal Swapped " + numberWithCommas(totalSwapped) + " BLUE \n_Current modifier_ *" + modifier + ":1* ! \nDownload the [BLUE wallet](https://chrome.google.com/webstore/detail/blue-worlds-safest-simple/laphpbhjhhgigmjoflgcchgodbbclahk) to swap");
                });
              } else {
                console.log("Loop complete, no new events.");
              }
            })();
          }
        });
      });
  }, 60000);
}
module.exports = requestApi;
