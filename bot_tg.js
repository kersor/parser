const NodeTelegranBotApi = require('node-telegram-bot-api')
const getTables = require('./app/app_tg')
require('dotenv').config()


const bot = new NodeTelegranBotApi(process.env.TOKEN_TG, {polling: true});
// id - канала
const channel_id = -1001270920937;
bot.on('message', msg => {
    setInterval(() => {
        getTables()
        .then(message => {
            // message - главный массив, в котором есть подмассивы (каждый подмассив - это пост с фотографиями)
            for(let i = 0; i < message.length; i++){
                // Делаем из всего этого, это
                // {
                //     type: 'photo',
                //     media: 'https://photo_path.jpg'
                // },
                // {
                //     type: 'photo',
                //     media: 'https://photo_path.jpg'
                // },
                // ...
                // ...
                // ...

                let photo_array = []
                for(let k = 0; k < message[i].length; k++){
                    let photo_image = {};
                    if(k == 0) photo_image = {type: 'photo', media: message[i][k]['url_image'], caption: 'Привет ' + (i + 1) }
                    else photo_image = {type: 'photo', media: message[i][k]['url_image']}
                    photo_array.push(photo_image)
                }
                
                bot.sendMediaGroup(channel_id, photo_array)
            }
        })
    }, 1000)
})

