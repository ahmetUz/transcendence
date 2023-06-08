import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io'
import { PrismaService } from '../prisma.service';

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
  
  // @SubscribeMessage('createMessage')
  // async create(
  //   @MessageBody() createMessageDto: CreateMessageDto,
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   console.log("heelo");
  //   const message = await this.messagesService.create(createMessageDto, client.id);

  //   this.server.emit('message', message);

  //   return message;
  // }

  @SubscribeMessage('createMessageChannel')
  async createMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const chatName: string = createMessageDto['chatName'];
    const password: string = createMessageDto['password'];

    const message = await this.messagesService.createMessage(createMessageDto, chatName, password, client.id);

    const channel = await this.prisma.channel.findFirst({
      where: {
        ChannelName: chatName,
        password: password
      },
      include: {users: true},
    })
    if (channel)
    {
      console.log("find channel");
      const channelUsers =  await this.prisma.channelUser.findMany({
        where: {
          channels: {
            some: {
              id: channel.id,
            },
          },
        },
      })
      channelUsers.forEach((channelUser) => {
        const userId = channelUser.clientId;
        this.server.to(userId).emit('message',message)
      })
      //this.server.emit('message', message);
    }

    return message;
  }

  @SubscribeMessage('findAllMessages')
  findAll() {
    console.log("findall");
    return this.messagesService.findAll();
  }

  @SubscribeMessage('findAllChannelMessages')
  async findAllChanMsg(
    @MessageBody('chatName') chatName:string,
    @MessageBody('password') password:string,
  ){
    console.log("findAllChannelMessages", chatName, " ",  password);
    return this.messagesService.findAllChanMsg(chatName, password);
  }

  @SubscribeMessage('join')
  joinRoom(
    @MessageBody('name') name:string,
    @MessageBody('chatName') chatName:string,
    @MessageBody('password') password:string,
    @ConnectedSocket() client: Socket,
  ){
    this.messagesService.identify(name, client.id, chatName, password);
    return "joined";
  }

  @SubscribeMessage('createChannel')
  async createChannel(
    @MessageBody('name') name:string,
    @MessageBody('createChatName') chatName:string,
    @MessageBody('createChatPassword') password:string,
    @ConnectedSocket() client: Socket,
  ){
    this.messagesService.createChannel(name, client.id, chatName, password);
    return "created";
  }

  @SubscribeMessage('typing')
  async typing(
    @MessageBody('isTyping') isTyping: boolean,
    @ConnectedSocket() client: Socket,
    ) {
    const name = await this.messagesService.getClientName(client.id);

    client.broadcast.emit('typing', {name, isTyping});
  }
}
