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

  identify(name: string, clientId: string) {
    this.clientToUser[clientId] = name;

    return Object.values(this.clientToUser);
  }

  getClientName(clientId: string){
    return this.clientToUser[clientId];
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

  findAll() {
    return this.prisma.textChannel.findMany();
  }
}
