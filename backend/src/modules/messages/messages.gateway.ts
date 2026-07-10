import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  namespace: '/messages',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private messagesService: MessagesService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.query?.token as string);
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {}

  @SubscribeMessage('join_match')
  handleJoinMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { matchId: string },
  ) {
    client.join(`match_${payload.matchId}`);
  }

  @SubscribeMessage('leave_match')
  handleLeaveMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { matchId: string },
  ) {
    client.leave(`match_${payload.matchId}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { matchId: string; content: string },
  ) {
    try {
      if (!payload.matchId || !payload.content?.trim()) {
        client.emit('error', { message: 'Dados inválidos' });
        return;
      }

      const message = await this.messagesService.send(
        payload as SendMessageDto,
        client.data.userId,
      );
      const messageWithSender = await this.messagesService.findById(message.id);

      this.server
        .to(`match_${payload.matchId}`)
        .emit('new_message', messageWithSender);
    } catch (error) {
      client.emit('error', {
        message:
          error instanceof Error ? error.message : 'Erro ao enviar mensagem',
      });
    }
  }
}
