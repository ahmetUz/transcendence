import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { PrismaService } from '/mnt/c/Users/ahmet/Desktop/to_finish/nestJs/transcendence/chat-server/src/prisma.service';

@Module({
  providers: [MessagesGateway, MessagesService, PrismaService]
})
export class MessagesModule {}
