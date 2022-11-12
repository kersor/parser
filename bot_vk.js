const { VK, Keyboard, getRandomId } = require('vk-io');
require('dotenv').config()


const { HearManager } = require('@vk-io/hear');
const hearManager = new HearManager();
const { QuestionManager } = require('vk-io-question');
const questionManager = new QuestionManager();

const { add_group_in_db, countDublicat, deleteOneGroup, add_ready_group_in_db, getTablesnp } = require('./app/app_vk');

const vk = new VK({
	token: process.env.TOKEN_VK,
});


vk.updates.use(questionManager.middleware);
vk.updates.on('message_new', hearManager.middleware);

hearManager.hear('Начать', context => {
	let keyboardStack = Keyboard
		.keyboard([[
			Keyboard.textButton({
				label: 'start',
				color: 'secondary',
			}),
		]
	])

	context.send({
		message: 'Нажмите start',
		keyboard: keyboardStack,
		random_id: getRandomId(),
	})

})

hearManager.hear(/start|Вернуться в меню/, context => {
	let keyboardStack = Keyboard
		.keyboard([[
			Keyboard.textButton({
				label: 'Добавить группу',
				color: 'secondary',
			}),
		],
		[
			Keyboard.textButton({
				label: 'Список групп',
				color: 'secondary',
			}),
		],
	]).inline()

	context.send({
		message: 'Выберите действие: ',
		keyboard: keyboardStack,
		random_id: getRandomId(),
	})

})

hearManager.hear(/Добавить группу|Группа уже добавлена/, async context => {
	let link = await context.question('Введите ссылку группы: ');
	let url = new URL(link.text)
	if(!url['origin'] == 'https://vk.com'){
		context.send('Введите ссылку группы:')
		return false;
	}	
	let zakrep = await context.question('Укажите количество закрепленных постов')
	zakrep = +zakrep.text;

	await add_group_in_db(context, url, zakrep)
		.then(message => {
			if(message == false){
				let keyboardStack = Keyboard
				.keyboard([
				[
					Keyboard.textButton({
						label: 'Вернуться в меню',
						color: 'negative',
					}),
				],
				]).inline()
			
				context.send({
					message: `Группа ${url['pathname'].substring(1)} уже находится в парсинге`,
					keyboard: keyboardStack,
					random_id: getRandomId(),
				})
			}
			else{
				let keyboardStack = Keyboard
				.keyboard([
				[
					Keyboard.textButton({
						label: 'Вернуться в меню',
						color: 'negative',
					}),
				],
				]).inline()
			
				context.send({
					message: `Группа ${url['pathname'].substring(1)} добавлена`,
					keyboard: keyboardStack,
					random_id: getRandomId(),
				})
			}
		})

})

hearManager.hear(/Список групп|Вернуться назад/, context => {
	let query = "SELECT `id_post`, `domen`, COUNT(`id_post`) AS `count` FROM `communities_auto` GROUP BY `id_post`, `domen`"
	countDublicat(query)
		.then(message => {
			if(message.length == 0){
				let keyboardStack = Keyboard
				.keyboard([[
					Keyboard.textButton({
						label: 'Вернуться в меню',
						color: 'negative',
					}),],
				]).inline()
			
				context.send({
					message: 'На данный момент ни одной группы не парсится',
					keyboard: keyboardStack,
					random_id: getRandomId(),
				})
			}
			for(let i = 0; i < message.length; i++){
				let keyboardStack = Keyboard
				.keyboard([[
					Keyboard.urlButton({
						label: 'Перейти в группу',
						url: 'https://vk.com/' + message[i]['domen']
					}),
				],
				[
					Keyboard.textButton({
						label: 'Удалить группу',
						color: 'negative',
						payload: {
							item: message[i]['domen'] 
						}
					}),
				],
				]).inline()
			
				context.send({
					message: 'Группа: ' + message[i]['domen'],
					keyboard: keyboardStack,
					random_id: getRandomId(),
				})
			}
			let keyboardStack = Keyboard
			.keyboard([[
				Keyboard.textButton({
					label: 'Вернуться в меню',
					color: 'negative',
				}),],
			]).inline()
		
			context.send({
				message: 'Это весь список групп',
				keyboard: keyboardStack,
				random_id: getRandomId(),
			})
		})
})

hearManager.hear(/Удалить группу/, async context => {
	await deleteOneGroup(context['messagePayload']['item'])

	let keyboardInline = Keyboard
	.keyboard([[
		Keyboard.textButton({
			label: 'Вернуться назад',
			color: 'negative',
		}),
	],
	]).inline();
	context.send({
		message: `Группа ${context['messagePayload']['item']} была удалена`,
		keyboard: keyboardInline,
		random_id: getRandomId(),
	})
})


setInterval(() => {
	add_ready_group_in_db();
}, 5000)

vk.updates.start();
