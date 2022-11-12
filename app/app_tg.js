const connect = require('./config')
const { selectAll, selectOne, deleteOne, insertOne, insertOneNoPromise, count, update } = require('./db')

// +----------------------------------------------------------+
// |    СОЗДАНИЕ МАССИВА ФОТОГРАФИЙ ДЛЯ ПОСТИНГА В Telegram   |
// +----------------------------------------------------------+
async function getTables(){ 
    // ФИЛЬТРАЦИЯ фотографий выставленных, от не выставвленных
    return new Promise((resolve, reject) => {
        
        let query = "SELECT `id_post`, `domen`, `id_group`, `zakrep`, `visual`, COUNT(`domen`) AS `count` FROM `communities_auto` GROUP BY `id_post`, `domen`, `id_group`, `zakrep`, `visual`";
        count(connect, query)
        // ФИЛЬТРАЦИЯ фотографий, у которых значение "visual" = 0 в массив
        .then(message => {
            let arr_domen = [];
            for(let i = 0; i < message.length; i++) if(message[i]['visual'] == 0) arr_domen.push("'"+message[i]['domen']+"'")
            return arr_domen
        })
        .then(message => {
            // Если нету новых (фотографии которые не выставлены), то мимо
            if(message.length > 0){
                console.log(message)
                const query_1 = `SELECT * FROM communities_auto WHERE domen IN(${message.join(', ')})`
                const query_2 = `UPDATE communities_auto SET visual = 1 `
                // Поменять значением на выставленное         
                update(connect, query_2, message.join(', '))
                // Собрать информацию у отсортированных фотографий                
                selectAll(connect, query_1)
                .then(msg => {
                    // msg - массив, в котором находятся массивы отсортированных ФОТОГРАФИЙ.
                    // А нам сначала надо, массивы постов, а уже после фотографий
                    // 
                    //      Было                                Стало
                    //  [                               [
                    //      [], // 1 пост                   [               //
                    //      [], // 1 пост       =>              [],         // 1 ПОСТ
                    //      [], // 2 пост                       [],         //
                    //  ]                                   ],              // 
                    //                                      
                    //                                      [               //
                    //                                          [],         // 2 пост
                    //                                      ],              //
                    //                                  ]                   
                    // 
                    // 

                    let arr_ready_post = [];
                    for(let i = 0; i < message.length; i++){
                        // Массив по посту (домен)
                        let arr_ready_domen = []
                        for(let j = 0; j < msg.length; j++){
                            // Если домен, который находится в отфильтрованных по "visual" равен домену, который находится в массиве от запроса на сбор инф-ии (selectAll)
                            // То закидываем его в массив по посту (домен)
                            if(message[i].replace(/'/g, "") == msg[j]['domen']) arr_ready_domen.push(msg[j])
                        }
                        // Затем закидываем в большой (общий) массив
                        arr_ready_post.push(arr_ready_domen)
                    }
                    
                    return arr_ready_post
                })
                .then(msg => {
                    resolve(msg)
                })
            }
        })
    })
    .then(message => {
        return message
    })
}

module.exports = getTables;