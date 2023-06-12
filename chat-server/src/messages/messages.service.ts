import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { PrismaService } from '../prisma.service';
import { Message } from './entities/message.entity';
import { Prisma } from '@prisma/client';


@Injectable()
export class MessagesService {
	constructor(private prisma: PrismaService) {}
	async identify(name: string, clientId: string, ChannelName: string, Channelpass: string) {
		const channel = await this.prisma.channel.findFirst({
			where: {
				ChannelName: ChannelName,
				password: Channelpass
			},
			include: {users: true},
		})
		if (!channel) {
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		else {
			const user = await this.prisma.channelUser.findFirst({
				where: {
					Name: name,
					channels: {
						some: {
							id: channel.id,
						},
					},
				},
			})
			if (!user)
			{
				const createUser = await this.prisma.channelUser.create({
					data: {
						clientId: clientId,
						Name: name,
						channels: {
							connect: { id: channel.id}
						}
					}
				})
				await this.prisma.channel.update({
					where: {id: channel.id},
					data: {
						users: {
							connect: {id: createUser.id}
						}
					}
				})
			}
			else
			{
				if (channel.ownerId == user.clientId) {
					await this.prisma.channel.update({
						where: {id: channel.id},
						data: {
							ownerId: clientId
						}
					})
				}
				await this.prisma.channelUser.update({
					where: {id: user.id},
					data: {clientId: clientId}
				})
			}
		}
	}

	async createChannel(name: string, clientId: string, ChannelName: string, Channelpass: string)
	{
		const channel = await this.prisma.channel.findFirst({
			where: {
				ChannelName: ChannelName,
				password: Channelpass
			},
		})
		if (channel){
			throw "Server: this channel already exists"
		}
		const createChannel = await this.prisma.channel.create({
			data: {
				ChannelName: ChannelName,
				password: Channelpass,
				ownerId: clientId,
			}
		})
		if (!createChannel) {
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		const createUser = await this.prisma.channelUser.create({
			data: {
				clientId: clientId,
				Name: name,
				channels: {
					connect: {
						id: createChannel.id,
					},
				},
			},
		})
		if (!createUser) {
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
	}

	async findChannelUsersForMe(clientId: string, chatName: string, password: string)
	{
		const channel = await this.prisma.channel.findFirst({
			where: {
				ChannelName: chatName,
				password: password
			},
			include: {users: true},
		})
		if (!channel) {
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		const user = await this.prisma.channelUser.findFirst({
			where: {
				clientId: clientId
			}
		})
		if (!user) {
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		const blockedByUsers = await this.prisma.block.findMany({
			where: {
				blockedUserId: user.id,
			},
			include: {
				blockedBy: true,
			},
		});

		if (blockedByUsers){
			const channelUsers = await this.prisma.channelUser.findMany({
				where: {
					channels: {
						some: {
							id: channel.id,
						},
					},
					NOT: {
						id: {
							in: blockedByUsers.map((blcokedUser) => blcokedUser.blockerUserId)
						}
					}
				},
			})
			return channelUsers;
		}
		const channelUsers = await this.prisma.channelUser.findMany({
			where: {
				channels: {
					some: {
						id: channel.id,
					},
				},
			},
		})
		return channelUsers;
	}

	async getClientName(clientId: string){
		const user = await this.prisma.channelUser.findFirst({
			where: {
				clientId: clientId,
			}
		})
		if (!user)
			return "unknown";
		return user.Name;
	}

	async createMessage(createMessageDto: CreateMessageDto, ChannelName: string, Channelpass: string, clientId: string) {
		const channel = await this.prisma.channel.findFirst({
			where: {
				ChannelName: ChannelName,
				password: Channelpass
			}
		})
		if (!channel) {
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		const user = await this.prisma.channelUser.findFirst({
			where: {
					clientId: clientId
				}
		})
		if (!user) {
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		else if (user.muted == true) {
			throw "Server: you are muted!";
		}
		const textChannel	= await this.prisma.textChannel.create({
			data: {
				name: user.Name,
				text: createMessageDto.text,
				channel: {
					connect: { id: channel.id }
				},
				channelUser: {
					connect: {id: user.id}
				},
			}
		});
		if (!textChannel) {
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		return textChannel;
	}

	async findChannelMessages(ChannelName: string, Channelpass: string) {
		const channel = await this.prisma.channel.findFirst({
			where: {
				ChannelName: ChannelName,
				password: Channelpass
			},
			include: { textChannels: true }
		})
		if (!channel) {
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		return channel.textChannels;
	}

	async findChannelMessagesForMe(ChannelName: string, Channelpass: string, clientId: string) {

		const channel = await this.prisma.channel.findFirst({
			where: {
				ChannelName: ChannelName,
				password: Channelpass
			},
		})
		if (!channel) {
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		const user = await this.prisma.channelUser.findFirst({
			where: {
				clientId: clientId,
			}
		})
		if (!user) {
			throw "Server: We experiencing issues. We will get back to you as soon as possible."
		}
		const blockedUsers = await this.prisma.block.findMany({
			where: {
				blockerUserId: user.id,
			},
			include: {
				blockedUser: true,
			}
		})
		if (!blockedUsers) {
			return await this.findChannelMessages(ChannelName, Channelpass);
		}
		const textChannels = await this.prisma.textChannel.findMany({
			where: {
				channelId: channel.id,
				NOT: {
					channelUserId: {
						in: blockedUsers.map((blcokedUser) => blcokedUser.blockedUserId)
					}
				}
			}
		})
		return textChannels;
	}
}
