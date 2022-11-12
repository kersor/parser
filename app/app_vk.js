const { selectAll, selectOne, deleteOne, insertOne, insertOneNoPromise, count, update } = require('./db');

const { VK } = require('vk-io');
const { HearManager } = require('@vk-io/hear');
const hearManager = new HearManager();
require('dotenv').config()

const connect  = require('./config');
const vkUser = new VK({
	token: process.env.TOKEN_VK_USER
});
vkUser.updates.on('message_new', hearManager.middleware);


// +---------------------------------+
// |    ДАБАВИТЬ ГРУППУ В DataBase   |
// +---------------------------------+
async function add_group_in_db(context, url, zakrep){
	let domen = url['pathname'].substring(1)
	let group = await vkUser.api.groups.getById({
		group_ids: domen
	})
	let group_id = group[0]['id']


	// Проверка на дубликат группы
	return selectOne(connect, "SELECT * FROM `communities_auto`", [['id_group', group_id]])
		.then(message => {
			if(message.length === 0){
				let query = "INSERT INTO `communities_auto` (`id_post`, `id_group`, `url_image`, `domen`, `zakrep`, `visual`) VALUES ?"
				insertOne(connect, query, iteration_post(true, group_id, domen, zakrep))
				return true
			}
			else return false
		})
}

// +-------------------------------------+
// |    ИТТЕРАЦИЯ JSON ОТВЕТА ГРУПП ВК   |
// +-------------------------------------+
async function iteration_post(first, group_id, domen, zakrep){
	return await vkUser.api.wall.get({
		owner_id: -group_id,
		domain: domen,
		offset: zakrep,
		count: 1,
		filter: 'owner'
	})
	.then(message => {
		// Запись ссылки поста для написании его в БД
		let link = '';
		// Запись id поста для написании его в БД
		let id_post = 0;
		// Запись всех фотографий с id в масс
		let arrayBigImages = [];

		if(message['items'][0]['signer_id'] == undefined){
			let attachments 
			
			if(message['items'][0]['copy_history'] == undefined) attachments = message['items'][0]['attachments']
			else attachments = message['items'][0]['copy_history'][0]['attachments']

			for(let i = 0; i < attachments.length; i++){
				if(attachments[i]['type'] == 'photo'){
					const sizes = attachments[i]['photo']['sizes']

					let arraySize = [];
					for(let j = 0; j < sizes.length; j++){
						arraySize.push(sizes[j]['height'])
					}

					let maxInedxSize = arraySize.indexOf(Math.max.apply(null, arraySize));	
                	link = sizes[maxInedxSize]['url'];
					id_post = message['items'][0]['id'];

					arrayBigImages.push([id_post, group_id, link, domen, zakrep, 0]) 
				}
			}
		}
		if(arrayBigImages.length > 0){
			return arrayBigImages
		}
	})
}

// +-----------------------------------------+
// |    ФУНКЦИЯ ДЛЯ ИНТЕРВАЛЬНОГО ПАРСИНГА   |
// +-----------------------------------------+
async function add_ready_group_in_db(){
	new Promise((resolve, reject) => {
		// Запрос в БД на количество имеющих групп
		countDublicat("SELECT `id_post`, `domen`, `id_group`, `zakrep`, COUNT(`id_post`) AS `count` FROM `communities_auto` GROUP BY `id_post`, `domen`, `id_group`, `zakrep`")
		.then(message => {
			// Если группы есть в БД
			if(message.length > 0){
				let arr = []
				for(let i = 0; i < message.length; i++){
					arr.push(iteration_post(false, message[i]['id_group'], message[i]['domen'], message[i]['zakrep']))
				}
				return [arr, message]
			}
		})
		.then((text) => {
			// Если групп нету в БД
			if(text != undefined){
				// Массив, в котором хранятся массивы пропарсенных групп, в которых хранятся массивы с фотографиями поста
				let photo_vk = text[0]
				// Фотографии с БД
				let photo_db = text[1]
				Promise.all(photo_vk)
				.then(photo_vk => {
					let arr_group = []
					let id_group = 0;
					// Цикл для перебора пропарсенных фотографий
					for(let i = 0; i < photo_vk.length; i++){
						// Если произошло не равенство фотографий с БД и с Вк
						if(photo_vk[i] !== undefined){
							if(photo_vk[i][0][0] != photo_db[i]['id_post']){
								// Заносим их в массив
								arr_group.push(photo_vk[i])
								// И записываем id_group
								id_group = photo_vk[i][0][1]
							} 
						}
					} 
					// Удаляем все фотографии с этим id_group
					if(id_group > 0){
						deleteOne(connect, "DELETE FROM `communities_auto`", ['id_group', id_group])
						resolve(arr_group)
					}
				}) 
			}
		})
	})
	.then(message => {	
		let query = "INSERT INTO `communities_auto` (`id_post`, `id_group`, `url_image`, `domen`, `zakrep`, `visual`) VALUES ?"
		insertOneNoPromise(connect, query, message)
	})
}

async function deleteOneGroup(domen){
	deleteOne(connect, "DELETE FROM `communities_auto`", ['domen', domen])
}

async function countDublicat(query){
	return count(connect, query)
		.then(message => {
			return message
		})
}



module.exports = { add_group_in_db, countDublicat, deleteOneGroup, add_ready_group_in_db}