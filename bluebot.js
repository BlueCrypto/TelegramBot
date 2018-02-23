const TelegramBot = require('node-telegram-bot-api');
const token = process.env.BLUE_BOT_API_KEY
const bot = new TelegramBot(token, {polling: true});

bot.onText(/(\/[a-zA-Z]+)/, (msg, match) => {
  const chatId = msg.chat.id;
  // console.log(msg)
  if (match.length < 1) {
    return
  }
  var command = match[0];
  commands = {
    '/website': 'https://www.etherblue.org/',
    '/twitter': 'https://twitter.com/EthereumBlue',
    '/telegram': 'https://t.me/joinchat/HBDo00IO49STMJuIwJi08g',
    '/whitepaper': 'https://www.etherblue.org/whitepaper',
    '/github': 'https://github.com/BlueCrypto/',
    '/announcement': 'https://bitcointalk.org/index.php?topic=2279214.0',
    '/discord': 'https://discord.gg/vKxnqxX',
    '/reddit': 'https://www.reddit.com/r/BlueCrypto/',
    '/cmc': 'https://coinmarketcap.com/currencies/ethereum-blue/',
    '/youtube': 'https://www.youtube.com/channel/UCNtv0tIgBYofh4LTWKKZj7A',
    '/team': 'You can meet the team [here](https://www.etherblue.org/team-blue)'
  };
  var options = {
    'parse_mode': 'markdown',
    'disable_web_page_preview': true
  }
  if (command in commands){
    bot.sendMessage(chatId, commands[command], options);
  }
  bot.deleteMessage(chatId, msg.message_id);
});
