import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io'
import { PrismaService } from '../prisma.service';
import { DateTime } from 'luxon';

//const COMMAND_HELPER: string = "to mute => /mute targetName durationInMinutes\n to block";

@WebSocketGateway({
	cors: {
		origin: '*',
	},
})
export class MessagesGateway {
	@WebSocketServer()
	server: Server;
	
	
	constructor(
		private readonly messagesService: MessagesService,
		private readonly prisma: PrismaService,
		) {}
		
	@SubscribeMessage('join')
	async joinRoom(
			@MessageBody('name') name:string,
			@MessageBody('chatName') chatName:string,
			@MessageBody('password') password:string,
			@ConnectedSocket() client: Socket,
		){
			try {
				await this.messagesService.identify(name, client.id, chatName, password);
			} catch (serverMessage) {
				//this.server.to(client.id).emit('serverMessage', serverMessage);
				this.server.to(client.id).emit('message', serverMessage);
				return (serverMessage);
			}
			return "joined";
	}

	@SubscribeMessage('createMessageChannel')
	async createMessage(
		@MessageBody() createMessageDto: CreateMessageDto,
		@ConnectedSocket() client: Socket,
	) {
		const chatName: string = createMessageDto['chatName'];
		const password: string = createMessageDto['password'];

		try {
			if (createMessageDto.text.startsWith("/")) {
					await this.execCommandMessage(createMessageDto.text, client.id, chatName, password);
					return (createMessageDto.text);
			}
			else {
					const message = await this.messagesService.createMessage(createMessageDto, chatName, password, client.id);
					const channelUsers = await this.messagesService.findChannelUsersForMe(client.id, chatName, password);
					channelUsers.forEach((channelUser) => {
						const userId = channelUser.clientId;
						if (this.server.sockets.sockets.has(userId)) {
							this.server.to(userId).emit('message',message)
						}
					})
					return message;
				}
		} 
		catch (serverMessage) {
			//this.server.to(client.id).emit('serverMessage', serverMessage);
			let serverMsg: CreateMessageDto = new CreateMessageDto();
			serverMsg.text = serverMessage;
			serverMsg.name = "SERVER";
			console.log(serverMessage);
			this.server.to(client.id).emit('message', serverMsg);
			return (serverMsg);
		}
	}

	// @SubscribeMessage('findAllMessages')
	// findAll() {
	// 	console.log("findall");
	// 	return this.messagesService.findAll();
	// }

	@SubscribeMessage('findAllChannelMessages')
	async findAllChanMsg(
		@MessageBody('chatName') chatName:string,
		@MessageBody('password') password:string,
		@ConnectedSocket() client: Socket,
	){
		try {
			return await this.messagesService.findChannelMessagesForMe(chatName, password, client.id);
		}
		catch (serverMessage) {
			//this.server.to(client.id).emit('serverMessage', serverMessage);
			this.server.to(client.id).emit('message', serverMessage);
			return (serverMessage);
		}
	}


	@SubscribeMessage('createChannel')
	async createChannel(
		@MessageBody('name') name:string,
		@MessageBody('createChatName') chatName:string,
		@MessageBody('createChatPassword') password:string,
		@ConnectedSocket() client: Socket,
	){
		try {
			await this.messagesService.createChannel(name, client.id, chatName, password);
		}
		catch (serverMessage) {
			//this.server.to(client.id).emit('serverMessage', serverMessage);
			this.server.to(client.id).emit('message', serverMessage);
			return (serverMessage);
		}
		return "created";
	}

	@SubscribeMessage('typing')
	async typing(
		@MessageBody('isTyping') isTyping: boolean,
		@MessageBody('chatName') chatName:string,
		@MessageBody('password') password:string,
		@ConnectedSocket() client: Socket,
		) {
		try {
			const name = await this.messagesService.getClientName(client.id);
			const channelUsers = await this.messagesService.findChannelUsersForMe(client.id, chatName, password);
			channelUsers.forEach((channelUser) => {
				const userId = channelUser.clientId;
				if (userId != client.id)
					this.server.to(userId).emit('typing', {name, isTyping})
			})
		}
		catch (serverMessage) {
			//this.server.to(client.id).emit('serverMessage', serverMessage);
			this.server.to(client.id).emit('message', serverMessage);
			return (serverMessage);
		}
	}

	/*commands*/
	async execCommandMessage(message: string, clientId: string, channelName: string, channelPass: string){
		const messageText = message.trim();
		const commandArgs = message.split(" ");

		if (messageText.startsWith("/") && (commandArgs.length > 0 && commandArgs.length <= 3)) {
			const command = commandArgs[0].substring(1);

			switch (command) {
				case "kick":
					console.log("lets kick");
					if (commandArgs.length < 3 || !(/^[0-9]+$/.test(commandArgs[2]))){
						throw "Server: Invalid argument.\n to kick => /kick targetName nbMinutes"
					}
					else {
						await this.kick(commandArgs[1], commandArgs[2], clientId, channelName, channelPass);
					}
					break;
				case "mute":
					console.log("lets mute");
					if (commandArgs.length < 3 || !(/^[0-9]+$/.test(commandArgs[2]))){
						throw "Server: Invalid argument.\n to mute => /mute targetName nbMinutes"
					}
					else {
						await this.mute(commandArgs[1], commandArgs[2], clientId, channelName, channelPass);
					}
					break;
				case "ban":
					if (commandArgs.length < 3 || !(/^[0-9]+$/.test(commandArgs[2]))){
						throw "Server: Invalid argument.\n to ban => /ban targetName nbMinutes"
					}
					else {
						await this.ban(commandArgs[1], commandArgs[2], clientId, channelName, channelPass);
					}
					break;
				case "block":
					console.log("lets block");
					if (commandArgs.length < 2){
						throw "Server: Invalid argument.\n to block => /block targetName"
					}
					else {
						await this.block(commandArgs[1], clientId, channelName, channelPass);
					}
					break;
				case "leave":
					console.log("lets leave");
					if (commandArgs.length != 1){
						throw "Server: Invalid argument.\n to leave => /leave "
					}
					else {
						await this.leave(clientId, channelName, channelPass);
					}
					break;
				case "assignAdminRole":
					console.log("lets assignAdminRole");
					if (commandArgs.length < 2){
						throw "Server: Invalid argument.\n to assignAdminRole => /assignAdminRole targetName"
					}
					else {
						await this.assignAdminRole(commandArgs[1], clientId, channelName, channelPass);
					}
					break;
				case "changeChannelName":
					console.log("lets changeChannelName");
					if (commandArgs.length < 2){
						throw "Server: Invalid argument.\n to changeChannelName => /changeChannelName newName"
					}
					else {
						await this.changeChannelName(commandArgs[1], clientId, channelName, channelPass);
					}
					break;
				case "changeChannelPass":
					console.log("lets changeChannelPass");
					if (commandArgs.length < 2){
						throw "Server: Invalid argument.\n to changeChannelPass => /changeChannelPass newPass"
					}
					else {
						await this.changeChannelPass(commandArgs[1], clientId, channelName, channelPass);
					}
					break;
				default:
					throw "Server: unknown command."
			}
		}
		else {
			throw "Server: unknown command."
		}
	}

	async changeChannelPass(newPass:string, executorId: string, channelName: string, channelPass: string) {
		const channel = await this.prisma.channel.findFirst({
			where: {
				ChannelName: channelName,
				password: channelPass
			},
			include: {users: true},
		})
		if (!channel){
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		else if (await this.messagesService.isOwner(channelName, channelPass, executorId) == false) {
			throw "Server: you need to be the channel owner to execute this command."
		}
		else {
			await this.prisma.channel.update({
				where: {
					id: channel.id
				},
				data: {
					password: newPass,
				}
			})
		}
	}

	async changeChannelName(newName:string, executorId: string, channelName: string, channelPass: string) {
		const channel = await this.prisma.channel.findFirst({
			where: {
				ChannelName: channelName,
				password: channelPass
			},
			include: {users: true},
		})
		if (!channel){
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		else if (await this.messagesService.isOwner(channelName, channelPass, executorId) == false) {
			throw "Server: you need to be the channel owner to execute this command."
		}
		const isAlreadyExist = await this.prisma.channel.findFirst({
			where: {
				ChannelName: newName
			}
		})
		if (isAlreadyExist) {
			throw "Server: a channel with this name already exists"
		}
		else {
			await this.prisma.channel.update({
				where: {
					id: channel.id
				},
				data: {
					ChannelName: newName,
				}
			})
		}
	}

	async assignAdminRole(targetUser: string, executorId: string, channelName: string, channelPass: string) {
		const channel = await this.prisma.channel.findFirst({
			where: {
				ChannelName: channelName,
				password: channelPass
			},
			include: {users: true},
		})
		if (!channel){
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		else if (await this.messagesService.isOwner(channelName, channelPass, executorId) == false) {
			throw "Server: you need to be the channel owner to execute this command."
		}
		else {
			const target = await this.prisma.channelUser.findFirst({
				where: {
					Name: targetUser,
					channelId: channel.id
				},
			})
			if (!target){
				throw "Server: You cannot assign admin role to someone who is not in this channel."
			}
			else if (target.clientId == executorId) {
				throw "Server: You cannot mute yourself."
			}
			else if (target.status == "admin") {
				await this.prisma.channelUser.update ({
					where: {id: target.id},
					data: {status: "user"},
				})
				throw `Server: ${targetUser} role has been downgraded.`
			}
			else {
				await this.prisma.channelUser.update ({
					where: {id: target.id},
					data: {status: "admin"},
				})
				throw `Server: ${targetUser} role has been upgraded.`
			}
		}
	}

	async block(targetUser: string, executorId: string, channelName: string, channelPass: string){
		const channel = await this.prisma.channel.findFirst({
			where: {
				ChannelName: channelName,
				password: channelPass
			},
			include: {users: true},
		})
		if (!channel){
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		else {
			const executor = await this.prisma.channelUser.findFirst({
				where: {
					clientId: executorId,
					channelId: channel.id
				},
			})
			if (!executor){
				throw "Server: We experiencing issues. We will get back to you as soon as possible."
			}
			const target = await this.prisma.channelUser.findFirst({
				where: {
					Name: targetUser,
					channelId: channel.id
				},
			})
			if (!target){
				throw "Server: You cannot block someone who is not in this channel."
			}
			else if (target.id == executor.id){
				throw "Server: You cannot block yourself."
			}
			else if ( await this.messagesService.isSuperUser(channelName, channelPass, executorId) == false ) {
				throw "Server: You cannot block the channel owner or an admin."
			}
			const	block = await this.prisma.block.findFirst({
				where: {
					blockedUserId: target.id,
					blockerUserId: executor.id,
				}
			})
			if (block) {
				await this.prisma.block.delete({
					where: {
						id: block.id
					}
				})
				throw `Server: ${targetUser} has been unblocked.`
			}
			const	blocked = await this.prisma.block.create({
				data: {
					blockedUserId: target.id,
					blockerUserId: executor.id,
					blockedBy: {
						connect: { id: target.id}
					},
					blockedUser: {
						connect: { id: executor.id }
					}
				},
			})
			if (blocked) {
				throw `Server: ${targetUser} has been blocked.`
			}
			else {
				throw `Server: An error has occurred, you cannot block this person at this time.`
			}
		}
	}

	async leave(executorId: string, channelName: string, channelPass: string){
		const channel = await this.prisma.channel.findFirst({
			where: {
				ChannelName: channelName,
				password: channelPass
			},
			include: {users: true},
		})
		if (!channel){
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		else {
			const target = await this.prisma.channelUser.findFirst({
				where: {
					clientId: executorId,
					channelId: channel.id
				},
			})
			if (this.server.sockets.sockets.has(target.clientId)) {
				const socket = this.server.sockets.sockets.get(target.clientId);
			if (socket)
				socket.disconnect(); // a changer apres ....
			}
		}
	}

	async mute(targetUser: string, duration: string, executorId: string, channelName: string, channelPass: string){
		const channel = await this.prisma.channel.findFirst({
			where: {
				ChannelName: channelName,
				password: channelPass
			},
			include: {users: true},
		})
		if (!channel){
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		else if (await this.messagesService.isSuperUser(channelName, channelPass, executorId) == false) {
			throw "Server: you can't mute someone, you are not the channel owner or admin!"
		}
		else {
			const target = await this.prisma.channelUser.findFirst({
				where: {
					Name: targetUser,
					channelId: channel.id
				},
			})
			if (!target){
				throw "Server: You cannot mute someone who is not in this channel."
			}
			else if (target.clientId == executorId) {
				throw "Server: You cannot mute yourself."
			}
			else if (target.status == "owner" || target.status == "admin") {
				throw "Server: You cannot mute a SuperUser."
			}
			else if (target.muted == false) {
				const expirationTimestamp = DateTime.now().plus({ minutes: parseInt(duration) }).toMillis();
				await this.prisma.channelUser.update ({
					where: {id: target.id},
					data: {
						muted: true, 
						muteExpiration: { set: new Date(expirationTimestamp) }
					},
				})
				throw `Server: ${targetUser} has been muted.`
			}
			else {
				await this.prisma.channelUser.update ({
					where: {id: target.id},
					data: {muted: false, muteExpiration: { set: null }},
				})
				throw `Server: ${targetUser} has been unmuted.`
			}
		}
	}

	async kick(targetUser: string, duration: string, executorId: string, channelName: string, channelPass: string){
		const channel = await this.prisma.channel.findFirst({
			where: {
				ChannelName: channelName,
				password: channelPass
			},
			include: {users: true},
		})
		if (!channel){
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		else if (await this.messagesService.isSuperUser(channelName, channelPass, executorId) == false) {
			throw "Server: you can't kick someone, you are not the channel owner or and admin."
		}
		else {
			const target = await this.prisma.channelUser.findFirst({
				where: {
					Name: targetUser,
					channelId: channel.id
				},
			})
			if (!target){
				throw "Server: You cannot kick someone who is not in this channel."
			}
			else if (target.clientId == executorId) {
				throw "Server: You cannot kick yourself."
			}
			else if (target.status == "owner" || target.status == "admin") {
				throw "Server: You cannot kick a SuperUser."
			}
			else if (this.server.sockets.sockets.has(target.clientId)) {
				const socket = this.server.sockets.sockets.get(target.clientId);
				if (socket) {
					socket.disconnect(); // a changer apres ....
				}
				const expirationTimestamp = DateTime.now().plus({ minutes: parseInt(duration) }).toMillis();
				await this.prisma.channelUser.update ({
					where: {id: target.id},
					data: {
						kicked: true,
						kickExpiration: { set: new Date(expirationTimestamp) }
					},
				})
				throw `Server: ${targetUser} has been kicked.`
			}
			else {
				throw `Server: ${targetUser} is not online.`
			}
		}
	}

	async ban(targetUser: string, duration: string, executorId: string, channelName: string, channelPass: string){
		const channel = await this.prisma.channel.findFirst({
			where: {
				ChannelName: channelName,
				password: channelPass
			},
			include: {users: true},
		})
		if (!channel){
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		else if (await this.messagesService.isSuperUser(channelName, channelPass, executorId) == false) {
			throw "Server: you can't ban someone, you are not the channel owner or and admin."
		}
		else {
			const target = await this.prisma.channelUser.findFirst({
				where: {
					Name: targetUser,
					channelId: channel.id
				},
			})
			if (!target){
				throw "Server: You cannot ban someone who is not in this channel."
			}
			else if (target.clientId == executorId) {
				throw "Server: You cannot ban yourself."
			}
			else if (target.status == "owner" || target.status == "admin") {
				throw "Server: You cannot ban a SuperUser."
			}
			else if (this.server.sockets.sockets.has(target.clientId)) {
				const socket = this.server.sockets.sockets.get(target.clientId);
				if (socket) {
					socket.disconnect(); // a changer apres ....
				}
				const expirationTimestamp = DateTime.now().plus({ minutes: parseInt(duration) }).toMillis();
				await this.prisma.channelUser.update ({
					where: {id: target.id},
					data: {
						banned: true,
						banExpiration: { set: new Date(expirationTimestamp) }
					},
				})
				throw `Server: ${targetUser} has been baned.`
			}
			else {
				throw `Server: ${targetUser} is not online.`
			}
		}
	}
}

