import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { PrismaService } from '../prisma.service';
import { Message } from './entities/message.entity';
import { Prisma } from '@prisma/client';


@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}
  messages: Message[] = [{ name: "Marius", text: 'heyoo'}];
  clientToUser = {};

  async identify(name: string, clientId: string, ChannelName: string, Channelpass: string) {
    const channel = await this.prisma.channel.findFirst({
      where: {
        ChannelName: ChannelName,
        password: Channelpass
      },
      include: {users: true},
    })
    if (channel)
    {
      console.log("find channel");
      const user =  await this.prisma.channelUser.findFirst({
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
        const user = await this.prisma.channelUser.create({
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
              connect: {id: user.id}
            }
          }
        })
        console.log("create user");
      }
    }
    else
      console.log("CANT FIND CHANNEL user");
    // else
    // {
    //   throw "the channel does not exist ";
    // }
    console.log("joined");
  }

  async createChannel(name: string, clientId: string, ChannelName: string, Channelpass: string)
  {
    const channel = await this.prisma.channel.findFirst({
      where: {
        ChannelName: ChannelName,
        password: Channelpass
      },
    })
    // if (channel)
    //  throw "the channel already exist ";
    const createChannel = await this.prisma.channel.create({
      data: {
        ChannelName: ChannelName,
        password: Channelpass,
        owner: name,
      }
    })
    if (createChannel)
      this.identify(name, clientId, ChannelName, Channelpass)
  }

  getClientName(clientId: string){
    return clientId;
    // return this.clientToUser[clientId];
  }

  async create(createMessageDto: CreateMessageDto, clientId: string) {
    const message = await this.prisma.textChannel.create({
      data: {
        name: this.clientToUser[clientId],
        text: createMessageDto.text,
      }
    })
    return message;
  }

  async createMessage(createMessageDto: CreateMessageDto, ChannelName: string, Channelpass: string, clientId: string) {
    console.log("start create msg");
    const channel = await this.prisma.channel.findFirst({
      where: {
        ChannelName: ChannelName,
        password: Channelpass
      }
    })
    if (!channel)
      console.log("Channel not found");
    const user = await this.prisma.channelUser.findFirst({
      where: {
          clientId: clientId
        }
    })
    const textChannel  = await this.prisma.textChannel.create({
      data: {
        name: user.Name,
        text: createMessageDto.text,
        channel: {
          connect: { id: channel.id }
        }
      }
    });
    console.log("end create msg");

    return textChannel;
  }

  findAll() {
    return this.prisma.textChannel.findMany();
  }

  async findAllChanMsg(ChannelName: string, Channelpass: string) {
    const channel = await this.prisma.channel.findFirst({
      where: {
        ChannelName: ChannelName,
        password: Channelpass
      },
      include: { textChannels: true }
    })
    if (!channel)
      return (null);

    console.log(channel.textChannels);
    return channel.textChannels;
  }
}
