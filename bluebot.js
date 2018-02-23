const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BLUE_BOT_API_KEY
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

bot.onText(/(\/[a-zA-Z]+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  const chatId = msg.chat.id;
  if (match.length < 1) {
    return
  }
  const command = match[0];
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
    '/team': 'https://www.etherblue.org/team-blue'
  };
  if (command in commands){
    bot.sendMessage(chatId, commands[command]);
  }
});