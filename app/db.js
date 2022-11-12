async function update(connect, query, arr){
    return new Promise((resolve, reject) => {
        connect.query(query, arr, function(err, results){
            resolve(results);
        })
    })
}

// update(connect, "UPDATE `communities_auto` SET visual = 1", ['domen', 'domen'])
// 	.then(message => {
// 		console.log(message)
// 	})

async function selectAll(connect, query){
    return new Promise((resolve, reject) => {
        connect.query(query, function(err, results){
            resolve(results);
        })
    })
}

// selectAll(connect, "SELECT * FROM `communities_auto`")
// 	.then(message => {
// 		console.log(message)
// 	})

async function selectOne(connect, query, arr){
    return new Promise((resolve, reject) => {
        for(let i = 0; i < arr.length; i++){
            if(arr.length > 1){
                if(i == 0) query += ` WHERE ${arr[i][0]} = '${arr[i][1]}'`
                if(i > 0) query += ` AND ${arr[i][0]} = '${arr[i][1]}'`
            }
            else if(arr.length == 1) query += ` WHERE ${arr[i][0]} = '${arr[i][1]}'`
        }
        connect.query(query, function(err, results){
            resolve(results);
        })
    })
}

// selectOne(connect, "SELECT * FROM `communities_auto`", [['id', '1'], ['id_post', '1'], ['url_group', '1']])
// 	.then(message => {
// 		console.log(message)
// 	})

async function deleteOne(connect, query, arr){
    return new Promise((resolve, reject) => {
        query += ` WHERE ${arr[0]} = '${arr[1]}'`
        connect.query(query, arr, function(err, results){
            if(err) console.error('Errr <<< ', err)
            resolve(results);
        })
    })
}

// deleteOne(connect, "DELETE FROM `communities_auto`", ['id', '1'])
// 	.then(message => {
// 		console.log(message)
// 	}) 

async function insertOne(connect, query, arr){
    return await new Promise((resolve, reject) => {
        arr.then(message => {
            connect.query(query, [message], function(err, results){
                if(err) console.error('Errr <<< ', err)
                resolve(results);
            })
        })
    })
}

async function insertOneNoPromise(connect, query, arr){
    return await new Promise((resolve, reject) => {
        connect.query(query, arr, function(err, results){
            if(err) console.error('Errr <<< ', err)
            resolve(results);
        })
    })
}
// insert(connect, "INSERT INTO `communities_auto` (`id`, `id_post`, `id_group`, `url_group`, `url_image`, `domen`) VALUES (NULL, ?, ?, ?, ?, ?)", [3, 3, 3, 3, 3])
// 	.then(message => {
// 		console.log(message)
// 	})

async function count(connect, query){
    return new Promise((resolve, reject) => {
        connect.query(query, function(err, results){
            if(err) console.error('Errr <<< ', err)
            resolve(results);
        })
    })
}

module.exports = { selectAll, selectOne, deleteOne, insertOne, insertOneNoPromise, count, update };







