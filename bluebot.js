const TelegramBot = require('node-telegram-bot-api');
const cmc = require('cmc-api');
var fs = require("fs");

const token = process.env.BLUE_BOT_API_KEY
const bot = new TelegramBot(token, {polling: true});

// ----- CODE DATABASE -------
var Datastore = require('nedb')
  , codes = new Datastore({ filename: 'codes_db', autoload: true })

function load_codes() {
  // expects codes.json to be a file in the same directory
  // containing a single json list as the root object with
  // the codes as string items
  if (fs.existsSync("codes.json")) {
    var content = fs.readFileSync("codes.json");
    var code_data = JSON.parse(content);
    var doc = { 'collection': 'unassigned_codes', 'codes': code_data };
    codes.insert(doc, function (err, newDoc) {});
  }
};

process.argv.forEach(function (val, index, array) {
  if (val == 'init_codes') {
    load_codes();
  };
});
// --------------------------

// ----- COMMAND LOGIC ------
const COMMAND_RATE_LIMIT = 30 * 1000;

var commands = {
    '/website': 'https://www.etherblue.org/',
    '/twitter': 'Keep in touch with us at our ' +
                '[twitter](https://twitter.com/EthereumBlue',
    '/telegram': 'https://t.me/joinchat/HBDo00IO49STMJuIwJi08g',
    '/whitepaper': 'Read up on what we\'re trying to accomplish in ' +
                    'our [whitepaper](https://www.etherblue.org/whitepaper)',
    '/github': 'Check out what we\'re working on at our ' +
                '[github](https://github.com/BlueCrypto/)',
    '/announcement': 'Check out where it all started at the bitcointalk ' +
                      '[announcement](https://bitcointalk.org/index.php?topic=2279214.0)',
    '/discord': 'Join us for a chat in our [discord](https://discord.gg/vKxnqxX)',
    '/reddit': 'Upvote us at our [subreddit](https://www.reddit.com/r/BlueCrypto/)',
    '/cmc': 'https://coinmarketcap.com/currencies/ethereum-blue/',
    '/youtube': 'https://www.youtube.com/channel/UCNtv0tIgBYofh4LTWKKZj7A',
    '/team': 'You can meet the team [here](https://www.etherblue.org/team-blue)',
    '/price': '',
    '/giveaway': 'please DM me the /getcode command to receieve your code',
};
// the help command lists all of the available commands
var help = "I'm Beru! I can help you, just type any of these commands:\n";
commands['/help'] = help + Object.keys(commands).join('\n');
commands['/start'] = commands['/help'];

// commands that don't just respond static text, or are unlimited
var dm_commands = [ '/getcode', '/start' ];

var last_command_time = {};

function init_last_command_time() {
  for (var key in commands) {
    last_command_time[key] = 0
  };
};

init_last_command_time();
// ---------------------------

// ----- CUSTOM COMMANDS -----
function price(chatId, options) {
  cmc.getCoin("Ethereum-Blue")
    // this function is called when the web request Promise returns
    .then(coin => {
      var price_usd = coin[0].price_usd;
      var price_btc = coin[0].price_btc;
      var perc = coin[0].percent_change_24h;
      var out = `BLUE is currently trading at ${(price_btc *100000000).toLocaleString()} Sats or $${price_usd} (${perc}%)`;
      bot.sendMessage(chatId, out, options);
    })
    // in case the cmc api is not available, notify the user something
    // went wrong
    .catch(error => {
      var out = "Sorry! Can't get the price for you right now :(";
      bot.sendMessage(chatId, out, options);
      console.log(error);
    });
};

function giveaway(chatId, userId, options) {
  // search for the user in the assigned codes
  codes.findOne({ 'userId': userId }, function (err, doc) {
    if (doc) {
      console.log('found existing code for user: ' + doc.code);
      var code_msg = 'Your giveaway code is: ' + doc.code;
      bot.sendMessage(chatId, code_msg, options);
    } else {
      var code_search = {'collection': 'unassigned_codes'};
      // retrieve the list of codes
      codes.findOne(code_search, function(err, doc) {
        // grab one from the top
        var code = doc.codes[0];
        var code_msg = 'Your giveaway code is: ' + code;
        console.log('assigning code: ' + code + ' to user: ' + userId);
        var entry = { 'userId': userId, 'code': code };
        // insert a new record tying the code to the user
        codes.insert( entry, function (err, newDoc) {
            // update the code list by popping the code we just 
            // got off the stack to prevent it from being
            // assigned to another user
            codes.update(
              code_search,
              { $pop: { 'codes': -1 } }, 
              {}, function () {}
            );
        });
        // send the code to the user
        bot.sendMessage(chatId, code_msg, options);
      });
    };
  });
};
// ----------------

// ----- COMMAND RESPONSE -----
function safeDeleteMsg(msg) {
  var is_dm = msg.chat.id == msg.from.id;
  if (! is_dm) {
    console.log('is_dm == ' + is_dm + ' chatId == ' + msg.chat.id + ' userId == ' + msg.from.id);
    // we can't delete messages in DMs so don't try
    bot.deleteMessage(msg.chat.id, msg.message_id);
  };
}

bot.onText(/^(\/[a-zA-Z]+)/, (msg, match) => {
  const chatId = msg.chat.id;
  var user = msg.from.username;
  var command = match[0];
  var is_dm = chatId == msg.from.id;

  var is_valid_command = Object.keys(commands).indexOf(command) >= 0;
  var is_valid_dm_command = dm_commands.indexOf(command) >= 0;
  // if the command isn't valid, don't respond
  if (! is_valid_command && ! is_valid_dm_command){
    console.log(`unrecognized command: ${command} from user: ${user}`);
    return
  };
  // if the command has been recently reponsed to, delete
  // and dont respond
  var limited = Date.now() - last_command_time[command] < COMMAND_RATE_LIMIT;
  if (limited && ! is_dm) {
    console.log(`limited on the ${command} command from user: ${user}`);
    safeDeleteMsg(msg);
  } else {
    // update the last command time to now
    last_command_time[command] = Date.now();
  };
  console.log(`responding to command : ${command}`);
  console.log(msg);

  // rich link previews can get annoying so we disable them
  var options = {
    'parse_mode': 'markdown',
    'disable_web_page_preview': true
  };

  if(command == "/price") {
    price(chatId, options);
    safeDeleteMsg(msg);
  // only send users a code if the user is DMing beru
  } else if (command == "/getcode" && is_dm){
    giveaway(chatId, msg.from.id, options);
  }
  else if (is_valid_command) {
    bot.sendMessage(chatId, `${user}, ${commands[command]}`, options);
    safeDeleteMsg(msg);
  };
});
// -------------