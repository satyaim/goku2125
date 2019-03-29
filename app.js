//app.js
const keys = require('./config.js');
const TelegramBot = require('node-telegram-bot-api');
const rp = require('request-promise');
const cheerio = require('cheerio');
const ra = require('random-useragent');
const token = keys.telegramKey;
const bot = new TelegramBot(token, {polling: true});

const greet = [[ 'French','Spanish','German','Italian','Portugese','Hindi','Persian','Russian','Japanese','Korean', 'Turkish', 'Bahasa Indonesia'],
  ['BONJOUR','HOLA','HALLO','CIAO','OLÀ','NAMASTE','SALAAM','ZDRAS-TVUY-TE','OHAYO','AHN-YOUNG-HA-SE-YO', 'MERHABA', 'HALO']];
const greetings = [];

for(let iter = 0; iter<greet[0].length; iter++){
  greetings.push({
    type: 'article',
    id: iter,
    title : greet[0][iter],
    input_message_content: {
      message_text : greet[1][iter]
    }
  });
}
// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];

  bot.sendMessage(chatId, resp);
});


bot.onText(/\/start/, (msg, match) => {
  const chatId = msg.chat.id;
  const chatPerson = msg.chat.first_name;
  const reply = 'Hey ' + chatPerson + '! This is Goku bot.';
  const resp = match[1];
  if(!resp)
    bot.sendMessage(chatId, reply);
  else 
    bot.sendMessage(chatId, reply + resp);
});

bot.onText(/\/song/, (msg, match) => {
  const chatId = msg.chat.id;
  const songName = msg.text.substring(6).replace(/ /g,'+');
  //Example : //bot.sendPhoto( msg.chat.id, 'https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Wikipedia-logo-v2.svg/1122px-Wikipedia-logo-v2.svg.png', {caption : 'caption'})
  if(!songName){
    bot.sendMessage(chatId, 'Example : /song I See Fire');
    return;
  }
  const searchURL = keys.songSearchURL+songName;

  console.log(match);

  rp({uri : searchURL, json : true, headers: { 'User-Agent': ra.getRandom() }})
    .then(function(html){
      console.log(searchURL);
      const result = JSON.parse(html.substring(html.indexOf('(')+1, html.length-1));
      console.log(result);
      // Populate Reply With Songs as options
      let reply = 'Select Song to Download\n\n';
      const length = result.results.length;
      if(length==0) {
        bot.sendMessage(chatId, 'No Song Found For Your Query');
        return;
      }
      console.log(length);
      let iter = 0;
      while(iter<length){
        const artistString = result.results[iter].artist? 'Artist: ' + result.results[iter].artist + '\n' : '';
        reply += ( (iter+1).toString() + '. ' + result.results[iter].title + '\n' + artistString + result.results[iter].description + '\n\n');
        iter += 1;
        console.log(reply);
      }
      // Populate Custom Keyboard
      iter=0;
      let keyboard = [];
      const size = parseInt(Math.sqrt(length));
      console.log('size'+size);
      let rowboard, col;
      while(iter<size){
        rowboard = [];
        col =0 ;
        while(col<size){
          rowboard[col] = (iter*size+col+1).toString();
          col++;
        }
        keyboard.push(rowboard);
        iter++;
      }
      rowboard= [];
      iter = size*size+1;
      while(iter<=length){
        rowboard[iter-size*size-1]= iter.toString();
        iter++;
      }
      keyboard.push(rowboard);
      console.log(keyboard);
      // Send fetched Data
      bot.sendMessage(chatId, reply,
        { reply_markup : 
          { 'keyboard': keyboard,
            'resize_keyboard' : true,
            'one_time_keyboard': true,
            'force_reply': true 
          }
        } 
      )
        .then(function(sent){
          bot.once('message', function(response){
            console.log(sent);
            const choice = parseInt(response.text);
            const songURL = keys.songSongURL+result.results[choice-1].url;
            rp({uri : songURL, json : true, headers: { 'User-Agent': ra.getRandomData() }})
              .then(function(html){
                if(JSON.parse(html.substring(html.indexOf('(')+1, html.length-1))){
                  const songObj = JSON.parse(html.substring(html.indexOf('(')+1, html.length-1));
                  console.log(songObj.song);
                  const { title,artist,album,url,date,albumart } = songObj.song;
                  console.log(albumart);
                  bot.sendAudio( chatId, url, {
                    caption : album+', '+date, 
                    thumb : albumart,
                    performer : artist,
                    title : title
                  }, 
                  function(err, res){
                    bot.sendMessage(chatId, 'Sorry! Error Occured 100');
                  }
                  );
                }
              })
              .catch(function(err){
                console.log(Object.keys(err));
                bot.sendMessage(chatId, 'Sorry! Error Occured 101');
              });
          });
        })
        .catch(function(err){
          console.log(err);
          bot.sendMessage(chatId, 'Sorry! Error Occured 102');
        });
    })
    .catch(function(err){
      console.log(err);
      bot.sendMessage(chatId, 'Sorry! Error Occured 103');
      //console.log(err.response)
      //handle error
    });


});

bot.onText(/\/vs/, (msg, match) => {
  const chatId = msg.chat.id;
  const vs = msg.text.substring(4);
  let vs1 = vs.split(' ')[0];
  let vs2 = vs.split(' ')[1];
  let reply;
  const URL = 'https://www.google.com/search?q='+vs1+'+vs+'+vs2;

  console.log(match);

  if(!vs1 || !vs2){
    bot.sendMessage(chatId, 'Example : /vs ind aus');
    return;
  }

  rp(URL)
    .then(function(html){
      reply = html.replace(/<\/?[^>]+(>|$)/g, ' ');
      reply = reply.split(' results   ')[2].split('hours ago')[0].split('All times are in')[0].substring(0,300);
      console.log(reply);
      if(!reply)
        reply= 'Coundn\'t find result. Sorry';
      bot.sendMessage(chatId, reply); 
    })
    .catch(function(err){
      reply= 'Sorry! Coundn\'t find result.';
      bot.sendMessage(chatId, reply);
      console.log(err);
    });


});

bot.onText(/\/livecri/, (msg, match) => {
  const chatId = msg.chat.id;
  const URL = 'https://www.cricbuzz.com/cricket-match/live-scores';

  console.log(match);

  rp(URL)
    .then(function(html){
      let data;
      data = html.replace(/<\/?[^>]+(>|$)/g, ' ').split('All  Domestic & Others')[1].split('Featured Videos')[0];
      data = data.replace(/ Live Score {2}Scorecard {2}Full Commentary {2}News {6}/g, 'STARTED <- MATCH\n\n');
      data = data.replace(/ {4}Read Preview {9}Match Facts {2}News {6}/g, 'YET TO START <- MATCH\n\n'); 
      data = data.replace(/&nbsp;/g,' ');
      data = data.replace(/&#8226;/g,' ');
      data = data.replace(/ {4}/g,' ');
      
      const $ = cheerio.load(html);
      // Obtain Match Titles and Links
      let reply = 'Select Option to Explore Match\n\n';
      const length = $('h3').find('a').length;
      let iter = 0;
      while(iter<length){
        reply += ( (iter+1).toString() + '. ' + $('h3').find('a')[iter].attribs.title + '\n');
        console.log($('h3').find('a')[iter++].attribs.href);
      }
      // Populate Custom Keyboard
      iter=0;
      let keyboard = [];
      const size = parseInt(Math.sqrt(length));
      let rowboard, col;
      while(iter<size){
        rowboard = [];
        col =0 ;
        while(col<size){
          rowboard[col] = (iter*size+col+1).toString();
          col++;
        }
        keyboard.push(rowboard);
        iter++;
      }
      rowboard= [];
      iter = size*size+1;
      while(iter<=length){
        rowboard[iter-size*size-1]= iter.toString();
        iter++;
      }
      keyboard.push(rowboard);
      // Send fetched Data
      bot.sendMessage(chatId, reply,
        { reply_markup : 
          { 'keyboard': keyboard,
            'resize_keyboard' : true,
            'one_time_keyboard': true,
            'force_reply': true 
          }
        } 
      )
        .then(function(sent){
          bot.once('message', function(response){
            console.log(sent);
            const choice = parseInt(response.text);
            reply = '';
            reply += (data.split('<- MATCH')[choice-1]);
            reply += '\n\nMore Info : https://cricbuzz.com' + $('h3').find('a')[choice-1].attribs.href ;
            bot.sendMessage(chatId, reply);
          });
        });
    })
    .catch(function(err){
      console.error(err);
      const reply= 'Sorry! Coundn\'t find result.';
      bot.sendMessage(chatId, reply);
    });


});

bot.on('inline_query', function(query){
  if(!query.query)
    bot.answerInlineQuery(query.id, [{ type : 'article', id : 'goku', title : 'GoKu', input_message_content: {message_text : ' Go<3Ku'}}]);
  if(query.query == 'cri'){
    let results = [];
    const URL = 'https://www.cricbuzz.com/cricket-match/live-scores';
    rp(URL)
      .then(function(html){
        let data;
        data = html.replace(/<\/?[^>]+(>|$)/g, ' ').split('All  Domestic & Others')[1].split('Featured Videos')[0];
        data = data.replace(/ Live Score {2}Scorecard {2}Full Commentary {2}News {6}/g, 'LIVE <- MATCH\n\n');
        data = data.replace(/ {4}Read Preview {9}Match Facts {2}News {6}/g, 'YET TO START <- MATCH\n\n'); 
        data = data.replace(/&nbsp;/g,' ');
        data = data.replace(/&#8226;/g,' ');
        data = data.replace(/ {4}/g,' ');
        console.log(data);

        let $ = cheerio.load(html);
        const length = $('h3').find('a').length;
        let iter = 0;
        while(iter<length){
          results.push({ 
            type : 'article', 
            id : iter, 
            title: $('h3').find('a')[iter].attribs.title, 
            input_message_content: {
              message_text : data.split('<- MATCH')[iter]+'\n\nMore Info : https://cricbuzz.com' + $('h3').find('a')[iter].attribs.href
            }
          });
          iter++;
        }
        console.log(results);
        bot.answerInlineQuery(query.id, results);
      })
      .catch(function(err){
        console.log(err);
      });
  }
  if(query.query=='greet'){
    bot.answerInlineQuery(query.id, greetings);
  }
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log(chatId);
  //bot.sendMessage(chatId, 'Received your message');
});	