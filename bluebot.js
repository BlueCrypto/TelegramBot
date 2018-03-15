const TelegramBot = require('node-telegram-bot-api');
const token = process.env.BLUE_BOT_API_KEY
const bot = new TelegramBot(token, {polling: true});
const cmc = require('cmc-api');

function price() {
  cmc.getCoin("Ethereum-Blue")
    .then(coin => {
      price_usd = coin[0].price_usd;
      price_btc = coin[0].price_btc;
      perc = coin[0].percent_change_24h;
      out = `BLUE is currently trading at ${(price_btc *100000000).toLocaleString()} Sats or $${price_usd} (${perc}%)`;
      bot.sendMessage(chatId, out, options);
      p();
    })
    .catch(error => {
      out = "Sorry! Can't get the price for you right now :(";
      console.log(out);
    });
};

bot.onText(/(\/[a-zA-Z]+)/, (msg, match) => {
  const chatId = msg.chat.id;
  console.log(msg);
  console.log(chatId);
  var user = msg.from.username;
  if (match.length < 1) {
    return
  }

  var options = {
    'parse_mode': 'markdown',
    'disable_web_page_preview': true
  };

  var help = "I'm Beru! I can help you, just type any of these commands:\n";
  help += "/website\n";
  help += "/twitter\n";
  help += "/telegram\n";
  help += "/whitepaper\n";
  help += "/github\n";
  help += "/announcement\n";
  help += "/discord\n";
  help += "/reddit\n";
  help += "/cmc\n";
  help += "/youtube\n";
  help += "/team\n";
  help += "/price\n";
  help += "/help\n";
  var command = match[0];
  commands = {
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
    '/help': help,
    '/pp': ''
  };
  var username = ''
  console.log(command);
  if (command in commands){
    if(command == "/pp") {
      sleep(500);
      console.log('price');
      price(options, chatId, bot);
    }
    else {
      bot.sendMessage(chatId, `${user}, ${commands[command]}`, options);
      bot.deleteMessage(chatId, msg.message_id);
    }
  };
});
