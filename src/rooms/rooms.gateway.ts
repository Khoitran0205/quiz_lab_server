import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomsService } from 'src/services/rooms.service';

@WebSocketGateway({
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'],
})
export class ChatsGateway {
  listSocketUser: any[];

  constructor(private readonly roomsService: RoomsService) {
    this.listSocketUser = [];
  }

  //   async onModuleInit() {}

  async handleConnection(socket: Socket, ...args: any[]) {
    console.log('connected');
  }

  @SubscribeMessage('userConnected')
  async handleUserConnected(socket: Socket, data: any) {
    const { userId, roomCode } = data;
    if (userId) {
      this.listSocketUser?.push({
        socketId: socket?.id,
        userId,
      });

      const existedRoom = await this.roomsService.findRoomByCode(roomCode);
      if (existedRoom) socket?.join(roomCode);

      console.log(this.listSocketUser);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(socket: Socket, data: any) {
    const { conversationCode, message } = data;
    socket.broadcast.to(conversationCode).emit('newMessage', message);
  }

  async handleDisconnect(socket: Socket) {
    this.listSocketUser = this.listSocketUser?.filter(
      (socketUser) => socketUser?.socketId !== socket?.id,
    );
    console.log(this.listSocketUser);
  }
}
