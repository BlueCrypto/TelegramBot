const TelegramBot = require('node-telegram-bot-api');
const token = process.env.BLUE_BOT_API_KEY
const bot = new TelegramBot(token, {polling: true});
const cmc = require('cmc-api');

const COMMAND_RATE_LIMIT = 30 * 1000;

const commands = {
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
    '/price': "Please don't speculate about price here.",
    '/pp': ''
};

var last_command_time = {};

function init_last_command_time() {
  for (var key in commands) {
    last_command_time[key] = 0
  }
};

init_last_command_time();

function price(chatId, options) {
  cmc.getCoin("Ethereum-Blue")
    // this function is called when the web request Promise returns
    .then(coin => {
      price_usd = coin[0].price_usd;
      price_btc = coin[0].price_btc;
      perc = coin[0].percent_change_24h;
      out = `BLUE is currently trading at ${(price_btc *100000000).toLocaleString()} Sats or $${price_usd} (${perc}%)`;
      bot.sendMessage(chatId, out, options);
    })
    // in case the cmc api is not available, notify the user something
    // went wrong
    .catch(error => {
      out = "Sorry! Can't get the price for you right now :(";
      bot.sendMessage(chatId, out, options);
      console.log(error);
    });
};

bot.onText(/^(\/[a-zA-Z]+)/, (msg, match) => {
  const chatId = msg.chat.id;
  var user = msg.from.username;
  var command = match[0];

  // if the command isn't valid, delete it and don't respond
  if (Object.keys(commands).indexOf(command) < 0){
    console.log(`invalid command: ${command} from user: ${user}`)
    bot.deleteMessage(chatId, msg.message_id);
    return
  };
  // if the command has been recently reponsed to, delete
  // and dont respond
  if (Date.now() - last_command_time[command] < COMMAND_RATE_LIMIT) {
    console.log(`limited on the ${command} command from user: ${user}`)
    bot.deleteMessage(chatId, msg.message_id);
    return
  } else {
    // update the last command time to now
    last_command_time[command] = Date.now()
  };
  console.log(`responding to command : ${command}`)
  console.log(msg);
  console.log(chatId);

  // rich link previews can get annoying so we disable them
  var options = {
    'parse_mode': 'markdown',
    'disable_web_page_preview': true
  };

  // the help command lists all of the available commands
  var help = "I'm Beru! I can help you, just type any of these commands:\n";
  commands['/help'] = help + Object.keys(commands).join('\n');

  if(command == "/pp") {
    price(chatId, options);
    bot.deleteMessage(chatId, msg.message_id);
  }
  else {
    bot.sendMessage(chatId, `${user}, ${commands[command]}`, options);
    bot.deleteMessage(chatId, msg.message_id);
  };
});
