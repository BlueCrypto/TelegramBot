//bluebot.js
var balance = 0;
function bluebot() {
  const fetch = require("node-fetch");
  const TelegramBot = require("node-telegram-bot-api");
  const cmc = require("cmc-api");
  // byz chat ID -1001435661947
  // blue chat ID -1001108272084
 
  //SET CHAT IDS
  const chatIDs = [-1001108272084,-1001435661947];  



  var fs = require("fs");
  var AsyncLock = require("async-lock");
  var lock = new AsyncLock();

  const antispam = require("./antispam");

  const dotenv = require("dotenv");
  dotenv.config();
  const token = process.env.BLUE_BOT_API_KEY;

  const bot = new TelegramBot(token, { polling: true });

  // ------ MISC -----------
  function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, "g"), replace);
  }
  function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  // ----- CODE DATABASE -------
  var Datastore = require("nedb"),
    // codes = new Datastore({ filename: "codes_db", autoload: true }),
    chatDB = new Datastore({ filename: "chat_db", autoload: true });

  muteDB = new Datastore({ filename: "mute_db", autoload: true });
  muteDB.loadDatabase();
  chatDB.loadDatabase();

  // codes.persistence.setAutocompactionInterval(300000);
  // Using a unique constraint with the index
  // codes.ensureIndex({ fieldName: "code", unique: true }, function(err) {});

  /* function load_codes() {
  // expects codes.json to be a file in the same directory
  // containing a single json list as the root object with
  // the codes as string items
  if (fs.existsSync("codes.json")) {
    var content = fs.readFileSync("codes.json");
    var code_data = JSON.parse(content);
    var doc = { collection: "unassigned_codes", codes: code_data };
    codes.insert(doc, function(err, newDoc) {});
  }
}*/

  function postImage(chatId, img) {
    bot.sendPhoto(chatId, img, { caption: "Not financial advice :]" });
  }

  /*  process.argv.forEach(function(val, index, array) {
  if (val == "init_codes") {
    load_codes();
  }
}); */
  // --------------------------

  // ----- COMMAND LOGIC ------
  const COMMAND_RATE_LIMIT = 5 * 1000;

  var commands = {
    "/website": "Check out our website at https://www.blueprotocol.com",
    "/roadmap": "Check out our roadmap [here](https://www.blueprotocol.com/roadmap/)",
    "/twitter": "Keep in touch with us at our " + "[twitter](https://twitter.com/Blue_Protocol)",
    "/telegram": "https://t.me/joinchat/HBDo00IO49STMJuIwJi08g",
    "/whitepaper": "Read up on what we're trying to accomplish in " + "our [whitepaper](https://www.blueprotocol.com/whitepaper.pdf)",
    "/github": "Check out what we're working on at our " + "[github](https://github.com/BlueCrypto/)",
    "/announcement": "Check out where it all started at the bitcointalk " + "[announcement](https://bitcointalk.org/index.php?topic=2279214.0)",
    "/discord": "Join us for a chat in our [discord](https://discord.gg/vKxnqxX)",
    "/reddit": "Upvote us at our [subreddit](https://www.reddit.com/r/BlueCrypto/)",
    "/cmc": "https://coinmarketcap.com/currencies/ethereum-blue/",
    "/youtube": "https://www.youtube.com/channel/UCNtv0tIgBYofh4LTWKKZj7A",
    "/team": "You can meet the team [here](https://www.blueprotocol.com/vision/)",
    "/price": "",
    "/price2": "",
    "/pricw": "",
    "/alex": "Everyone say hi to Alex!",
    "/hr": "",
    "/yn": "",
    "/moon": "",
    "/btc": "",
    "/gas": "",
    "/balance": "",
    "/swaps": ""
  };
  // the help command lists all of the available commands
  var help = "I'm Beru! I can help you, just type any of these commands:\n";
  commands["/help"] = help + Object.keys(commands).join("\n");

  // all commands we dont want to show up in help
  // must be added after we create the help command
  commands["/start"] = "hi! I'm Beru, you can see the list of commands you can use by using the /help command";

  // commands that don't just respond static text, or are unlimited
  var dm_commands = ["/start"];

  // commands that we choose not to limit
  var unlimited_commands = [];

  var last_command_time = {};

  function init_last_command_time() {
    for (var key in commands) {
      last_command_time[key] = 0;
    }
  }

  init_last_command_time();
  // ---------------------------

  // ----- CUSTOM COMMANDS -----
  /* function giveaway(chatId, userId, options) {
  // search for the user in the assigned codes
  codes.findOne({ userId: userId }, function(err, doc) {
    if (doc) {
      console.log("found existing code for user: " + doc.code);
      var code_msg =
        "Your giveaway code is: " +
        doc.code +
        "\nEnter it [here](https://gleam.io/Z2jRm/blue-protocols-trezor-t-and-20000-blue-giveaway)";
      bot.sendMessage(chatId, code_msg, options);
    } else {
      var code_search = { collection: "unassigned_codes" };
      // retrieve the list of codes
      lock.acquire(
        "key",
        function(done) {
          codes.findOne(code_search, function(err, doc) {
            // grab one from the top
            var code = doc.codes[0];
            var code_msg =
              "Your giveaway code is: " +
              code +
              "\nEnter it [here](https://gleam.io/Z2jRm/blue-protocols-trezor-t-and-20000-blue-giveaway)";
            console.log("assigning code: " + code + " to user: " + userId);
            var entry = { userId: userId, code: code };
            // insert a new record tying the code to the user
            codes.insert(entry, function(err, newDoc) {
              // update the code list by popping the code we just
              // got off the stack to prevent it from being
              // assigned to another user
              codes.update(
                code_search,
                { $pop: { codes: -1 } },
                {},
                function() {
                  done();
                }
              );
            });
            // send the code to the user
            bot.sendMessage(chatId, code_msg, options);
          });
        },
        function(err, ret) {}
      );
    }
  });
} */
  // ----------------

  // ----- COMMAND RESPONSE -----
  function safeDeleteMsg(msg) {
    var is_dm = msg.chat.id == msg.from.id;
    if (!is_dm && msg.deleted != true) {
      // we can't delete messages in DMs so don't try
      bot.deleteMessage(msg.chat.id, msg.message_id);
      msg.deleted = true;
    }
  }

  bot.onText(/^(\/[a-zA-Z]+)/, (msg, match) => {
    console.log("Got a new message : " + msg.text + " From :" + msg.chat.username);
    function cmdprice(chatId, options, fun, morefun) {
      console.log("price check");
      cmc
        .getCoin("Ethereum-Blue")
        // this function is called when the web request Promise returns
        .then(coin => {
          console.log(coin);
          var price_usd = coin[0].price_usd;
          var price_btc = coin[0].price_btc;
          var perc = coin[0].percent_change_24h;
          var pp = "";
          if (perc.indexOf("-") === -1) {
            pp = "+";
          }
          var out = `BLUE is currently trading at ${(price_btc * 100000000).toLocaleString()} Sats or $${price_usd} (${pp}${perc}%)`;
          if (morefun) {
            var out = `BLUE is currently trading at ${(price_btc * 10000000000).toLocaleString()} Sats or $${price_usd * 100} (${pp}${perc}00%)`;
          } else if (fun) {
            var out = `BULE iss cureny treeding at ${(price_btc * 100000000).toLocaleString()} stosehes. $${price_usd} (${pp}${perc}%)`;
          }
          bot.sendMessage(chatId, out, options);
        })
        // in case the cmc api is not available, notify the user something
        // went wrong
        .catch(error => {
          var out = "Sorry! Can't get the price for you right now :(";
          bot.sendMessage(chatId, out, options);
          console.log(error);
        });
    }
    const chatId = msg.chat.id;
    // use the username, or the first name with non ascii chars dropped
    var user = msg.from.username || msg.from.first_name.replace(/[^\x00-\x7F]/g, "");
    var command = match[0];
    var is_dm = chatId == msg.from.id;
    var is_valid_command = Object.keys(commands).indexOf(command) >= 0;
    var is_valid_dm_command = dm_commands.indexOf(command) >= 0;
    // if the command isn't valid, don't respond
    if (!is_valid_command && !is_valid_dm_command && command !== "/top" && command !== "/score") {
      bot.sendMessage(chatId, "I don't recognise this command. Try /help for a list of available commands.", options);
      console.log(`unrecognized command: ${command} from user: ${user}`);
      return;
    }
    // if the command has been recently reponsed to, delete
    // and dont respond
    var limit_time_diff = Date.now() - last_command_time[command];
    var is_unlimited = unlimited_commands.indexOf(command) >= 0;
    var limited = limit_time_diff < COMMAND_RATE_LIMIT && !is_unlimited;
    if (limited && !is_dm) {
      console.log(`limited on the ${command} command from user: ${user}`);
      safeDeleteMsg(msg);
      return;
    } else {
      // update the last command time to now
      last_command_time[command] = Date.now();
    }

    //console.log(msg);

    // rich link previews can get annoying so we disable them
    var options = {
      parse_mode: "Markdown",
      disable_web_page_preview: true
    };

    if (command == "/price" || command == "/pricw" || command == "/price2") {
      console.log("Price check command");
      console.log(`${chatId} -- ${options} -- ${command == "/pricw"}`);
      console.log(price);
      if (command == "/price2") {
        out = `BLUE is currently trading at 8,934 Sats or $2.45 (+16,594%)`;
        bot.sendMessage(chatId, out, options);
        return;
      }
      cmdprice(chatId, options, command == "/pricw", command == "/price2");
      console.log("Done Price check command");
      safeDeleteMsg(msg);
      // only send users a code if the user is DMing beru
    } else if (command == "/hr") {
      if (Math.random() > 0.5) {
        bot.sendMessage(chatId, `Beru rules in favor of the defendant. BERU'S JUDGEMENT IS FINAL`);
      } else {
        bot.sendMessage(chatId, `Beru rules in opposition of the defendant. BERU'S JUDGEMENT IS FINAL`);
      }
    } else if (command == "/yn") {
      if (Math.random() > 0.5) {
        bot.sendMessage(chatId, `YES! BERU'S DECISION IS FINAL`);
      } else {
        bot.sendMessage(chatId, `NO! BERU'S DECISION IS FINAL`);
      }
    } else if (command == "/moon") {
      var r = Math.random();
      if (r < 0.33) {
        postImage(chatId, "/img/moon.jpg");
      } else if (r < 0.66) {
        postImage(chatId, "/img/chop.jpg");
      } else {
        postImage(chatId, "/img/dump.jpg");
      }
    } else if (command == "/btc") {
      var price = (Math.random() * 50000).toFixed(2);
      bot.sendMessage(chatId, `BTC will be around $${price} in the next 24 hours or so.`);
    } else if (command == "/balance") {
      console.log("Checking if address is valid");
      if (/^BYZ3[a-km-zA-HJ-NP-Z1-9]{24,33}$/.test(msg.text.substring(9, msg.length)) || /^0x[a-fA-F0-9]{40}$/.test(msg.text.substring(9, msg.length))) {
        console.log("Fetching");
        fetch("https://api.byz.network/api/allWallets")
          .then(function(response) {
            return response.json();
          })
          .then(function(myJson) {
            myJson = JSON.stringify(myJson);
            myJson = JSON.parse(myJson);
            let found = false;
            console.log("Checking JSON response");

            Object.keys(myJson).forEach(function(key) {
              if (/^0x[a-fA-F0-9]{40}$/.test(msg.text.substring(9, msg.length))) {
                if (myJson[key] && myJson[key].ethAddress == msg.text.substring(9, msg.length)) {
                  found = true;
                  console.log("Sucessfully checked ETH address amounts, sending");
                  bot.sendMessage(chatId, `Balance of that address is ${myJson[key].balance / 10 ** 8}BYZ.`, options);
                  return;
                } 
              }else if (myJson[key] && myJson[key].byzAddress == msg.text.substring(9, msg.length)&&/^BYZ3[a-km-zA-HJ-NP-Z1-9]{24,33}$/.test(msg.text.substring(9, msg.length))) {
                console.log("Sucessfully checked BYZ address amounts, sending");
                bot.sendMessage(chatId, `Balance of that address is ${myJson[key].balance / 10 ** 8}BYZ.`, options);
                found = true;
                return;
              }
            });
            !found ? bot.sendMessage(chatId, `No balance found, you can swap by going to byz.network#swap or downloading the [BLUE wallet](https://chrome.google.com/webstore/detail/blue-worlds-safest-simple/laphpbhjhhgigmjoflgcchgodbbclahk)`, options) : "";
          });
      } else {
        console.log("Got provided a incorrect address :" + msg.text.substring(9, msg.length) + " sending error message to user.");
        bot.sendMessage(chatId, `This is not a valid Ethereum or BYZ address. Add __space__ and BYZ or ETH address at the end of the command`, options);
      }
    } else if (command == "/swaps") {
      console.log("Fetching");
      fetch("https://api.byz.network/api/allEvents")
        .then(function(response) {
          return response.json();
        })
        .then(function(myJson) {
          myJson = JSON.stringify(myJson);
          myJson = JSON.parse(myJson);

          let lastID;
          let lastTotalSwapped;
          Object.keys(myJson).forEach(function(key) {
            lastID = myJson[key].id;
            lastTotalSwapped = numberWithCommas(parseFloat(myJson[key].totalSwapped / 10 ** 8).toFixed(0));
          });
          console.log("Fetching swap totals an deserializeing complete, sending message");
          bot.sendMessage(chatId, `There have been ` + lastID + " total swaps.\nTotal swapped " + lastTotalSwapped + "BLUE", options);
        });
    } else if (command == "/gas") {
      fetch("https://ethgasstation.info/json/ethgasAPI.json")
        .then(function(response) {
          return response.json();
        })
        .then(function(myJson) {
          myJson = JSON.stringify(myJson);
          myJson = JSON.parse(myJson);
          console.log("Got gas pricess sucssfully, sending");
          bot.sendMessage(chatId, `*Current gas prices*\nFast *${myJson.fast / 10}gwei* - time of ${myJson.fastWait}min.\nFastest *${myJson.fastest / 10}gwei* - wait time of  ${myJson.fastestWait}min.\nSafeLow *${myJson.safeLow / 10}gwei* - wait time of ${myJson.safeLowWait}min.\nAverage *${myJson.average / 10}*gwei -  wait time of ${myJson.avgWait}min.`, options);
        });
    } else if (is_valid_command) {
      var safe_user = replaceAll(user, "_", "");
      if (user) {
        bot.sendMessage(chatId, `${safe_user}, ${commands[command]}`, options);
      } else {
        bot.sendMessage(chatId, `${commands[command]}`, options);
      }
      safeDeleteMsg(msg);
    }
  });
  // -------------

  function modifyScore(increment, msg) {
    if (!chatIDs.includes(msg.chat.id)) {
      return;
    }
    chatDB.findOne({ user_id: msg.from.id }, function(err, doc) {
      var score = 1;
      if (!increment) {
        score = -1;
      }
      var old_score = score;
      if (err != undefined || doc == null) {
        console.log(err);
      } else {
        console.log(`Got a new non-command message ` + msg.text);
        console.log(`Found existing user :` + doc.username + " with a score of " + doc.score);

        var old_score = parseInt(doc.score);
        if (increment) {
          score = old_score + 3;
        } else {
          score = old_score - 1;
        }
      }
      var options = {
        parse_mode: "Markdown",
        disable_web_page_preview: true
      };
      console.log(`User score was ${old_score}. Updating to ${score}`);
      // bot.sendMessage(msg.chat.id, `User score was ${old_score}. Updating to ${score}`, options);
      // bot.sendMessage(msg.chat.id, `${score}`, options);
      if (score <= 1 && !increment) {
        safeDeleteMsg(msg);
        bot.sendMessage(msg.from.id, "Your message was deleted due too excessive posting of links. Please engage the chat in conversation before posting any more links.");
      }

      chatDB.update(
        { user_id: msg.from.id },
        {
          score: score,
          score: score,
          user_id: msg.from.id,
          username: msg.from.username,
          last_name: msg.from.last_name,
          first_name: msg.from.first_name
        },
        { upsert: true },
        function(err, numReplaced, upsert) {}
      );
    });
  }

  /* bot.onText(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/, (msg, match) => {
  console.log("LINK DETECTED");
  modifyScore(false, msg); 
}); */
  bot.onText(/(\/top)/, (msg, match) => {
    chatDB.find({}, function(err, docs) {
      //      console.log(docs);
      var sorted = docs.sort(function(a, b) {
        return parseInt(b.score) - parseInt(a.score);
      });
      //      docs = (docs.sort(function (a, b) { return parseInt(a.score) <= parseInt(b.score) })).slice(0,12);
      var top10 = sorted.slice(0, 10);

      var str = "\n       Beru's Top People       \n--------------------------\n";
      for (var i = 0; i < top10.length; i++) {
        var d = top10[i];
        var name = d.first_name;
        if (d.last_name != undefined && d.first_name != undefined) {
          name = d.first_name + " " + d.last_name;
        } else {
          if (d.first_name != undefined) {
            name = d.first_name;
          } else {
            name = d.username;
          }
        }
        str += `${d.score}  [${d.first_name || d.username}]\n`;
      }
      str += "\nScore is determined by how active you are in the BLUE chat. Type /score you check yours";
      bot.sendMessage(msg.chat.id, str, {});
    });
  });
  bot.onText(/(\/score)/, (msg, match) => {
    chatDB.findOne({ user_id: msg.from.id }, function(err, doc) {
      if (err == undefined) {
        var options = {
          parse_mode: "Markdown",
          disable_web_page_preview: true
        };
        if (doc != undefined) {
          bot.sendMessage(msg.chat.id, `${msg.from.first_name}, your reward score is: ${doc.score} BYZ. Talk more in BLUE chat to improve your score!`, options);
        } else {
          bot.sendMessage(msg.chat.id, `You have no score so far, talk more in BLUE chat to improve your score!`, options);
        }
      }
    });
  });

  bot.onText(/^[^/*]/, (msg, match) => {
    console.log(`Got new non command message : ${msg.chat.username} --   "${msg.text}"`);

    console.log(`In supplied chats?: ${chatIDs.includes(msg.chat.id)} `);
    if (typeof msg.entities != "undefined") {
      // Contains some kind of URL or image, etc, lose points
      for (var i = 0; i < msg.entities.length; i++) {
        //modifyScore(false, msg);

        if (msg.entities[i].type == "url") {
          console.log("DECREMENT SCORE");
          modifyScore(false, msg);
        }
      }
    } else {
      // console.log("SCORE CHECK DETECTED");
      modifyScore(true, msg);
    }
  });
}
module.exports = bluebot;
