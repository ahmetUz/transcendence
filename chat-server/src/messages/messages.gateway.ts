import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io'
import { PrismaService } from '../prisma.service';
import { channel } from 'diagnostics_channel';


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

		if (messageText.startsWith("/") && (commandArgs.length > 0 && commandArgs.length <= 2)) {
			const command = commandArgs[0].substring(1);
			const targetUser = commandArgs[1];

			switch (command) {
				case "kick":
					console.log("lets kick");
					await this.kick(targetUser, clientId, channelName, channelPass);
					break;
				case "mute":
					console.log("lets mute");
					await this.mute(targetUser, clientId, channelName, channelPass);
					break;
				case "block":
					console.log("lets block");
					await this.block(targetUser, clientId, channelName, channelPass);
					break;
			 /* case "ban":
					break;*/
				case "leave":
					console.log("lets leave");
					await this.leave(clientId, channelName, channelPass);
					break;
				default:
					throw "Server: unknown command."
			}
		}
		else {
			throw "Server: unknown command."
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
					channels: {
						some: {
							id: channel.id,
						},
					},
				},
			})
			if (!executor){
				throw "Server: We experiencing issues. We will get back to you as soon as possible."
			}
			const target = await this.prisma.channelUser.findFirst({
				where: {
					Name: targetUser,
					channels: {
						some: {
							id: channel.id,
						},
					},
				},
			})
			if (!target){
				throw "Server: You cannot block someone who is not in this channel."
			}
			else if (target.id == executor.id){
				throw "Server: You cannot block yourself."
			}
			else if ( target.clientId == channel.ownerId) {
				throw "Server: You cannot block the channel owner."
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
					channels: {
						some: {
							id: channel.id,
						},
					},
				},
			})
			if (this.server.sockets.sockets.has(target.clientId)) {
				const socket = this.server.sockets.sockets.get(target.clientId);
			if (socket)
				socket.disconnect(); // a changer apres ....
			}
		}
	}

	async mute(targetUser: string, executorId: string, channelName: string, channelPass: string){
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
		else if (channel.ownerId != executorId) {
			throw "Server: you can't mute someone, you are not the channel owner!"
		}
		else {
			const target = await this.prisma.channelUser.findFirst({
				where: {
					Name: targetUser,
					channels: {
						some: {
							id: channel.id,
						},
					},
				},
			})
			if (!target){
				throw "Server: You cannot mute someone who is not in this channel."
			}
			else if (target.clientId == executorId) {
				throw "Server: You cannot mute yourself."
			}
			else if (target.muted == false) {
				await this.prisma.channelUser.update ({
					where: {id: target.id},
					data: {muted: true},
				})
				throw `Server: ${targetUser} has been muted.`
			}
			else {
				await this.prisma.channelUser.update ({
					where: {id: target.id},
					data: {muted: false},
				})
				throw `Server: ${targetUser} has been unmuted.`
			}
		}
	}

	async kick(targetUser: string, executorId: string, channelName: string, channelPass: string){
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
		else if (channel.ownerId != executorId) {
			throw "Server: you can't kick someone, you are not the channel owner!"
		}
		else {
			const target = await this.prisma.channelUser.findFirst({
				where: {
					Name: targetUser,
					channels: {
						some: {
							id: channel.id,
						},
					},
				},
			})
			if (!target){
				throw "Server: You cannot kick someone who is not in this channel."
			}
			else if (target.clientId == executorId) {
				throw "Server: You cannot kick yourself."
			}
			else if (this.server.sockets.sockets.has(target.clientId)) {
				const socket = this.server.sockets.sockets.get(target.clientId);
				if (socket) {
					socket.disconnect(); // a changer apres ....
					throw `Server: ${targetUser} has been kicked.`
				}
			}
			else {
				throw `Server: ${targetUser} is not online.`
			}
		}
	}
}
