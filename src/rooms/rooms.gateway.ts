import { HttpException, HttpStatus } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { QuizzesService } from 'src/services/quizzes.service';
import { RoomsService } from 'src/services/rooms.service';
import { UsersService } from 'src/services/users.service';

@WebSocketGateway({
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'],
})
export class RoomsGateway {
  listActiveRoom: any[];

  constructor(
    private readonly roomsService: RoomsService,
    private readonly usersService: UsersService,
    private readonly quizzesService: QuizzesService,
  ) {
    this.listActiveRoom = [];
  }

  async findAndValidateRoomByCode(roomCode: string) {
    const existedRoom = await this.roomsService.findRoomByCode(roomCode);
    if (!existedRoom)
      throw new HttpException('room not found', HttpStatus.BAD_REQUEST);

    return existedRoom;
  }

  async getHostByRoomCode(roomCode: string) {
    const existedRoom = await this.findAndValidateRoomByCode(roomCode);

    const { id: roomId } = existedRoom;
    let hostUser = null;
    this.listActiveRoom?.map((activeRoom) => {
      activeRoom?.map((userInRoom) => {
        const { hostOfRoomId } = userInRoom;
        if (hostOfRoomId?.toString() === roomId?.toString())
          hostUser = userInRoom;
      });
    });

    return {
      hostUser,
      room: existedRoom,
    };
  }

  //   async onModuleInit() {}

  async handleConnection() {
    console.log('new-connection');
  }

  @SubscribeMessage('userConnected')
  async handleUserConnected(
    socket: Socket,
    data: { userId: string; roomCode: string },
  ) {
    const { userId, roomCode } = data;
    if (userId) {
      const { room: existedRoom, hostUser } = await this.getHostByRoomCode(
        roomCode,
      );

      socket?.join(roomCode);

      if (hostUser) {
        const { socketId } = hostUser;
        const existedUser = await this.usersService.findOne(userId);
        socket.to(socketId).emit('newUserConnected', { user: existedUser });
      }

      const { id, createdBy } = existedRoom;

      if (userId?.toString() === createdBy?.toString()) {
        this.listActiveRoom?.push([
          {
            socketId: socket?.id,
            userId,
            hostOfRoomId: id,
          },
        ]);
      } else {
        this.listActiveRoom?.map((activeRoom) => {
          const roomHost = activeRoom[0];
          const { hostOfRoomId } = roomHost;
          if (hostOfRoomId === id)
            activeRoom?.push({
              socketId: socket?.id,
              userId,
            });
        });
      }

      console.log(this.listActiveRoom);
    }
  }

  @SubscribeMessage('startQuiz')
  async handleStartQuiz(socket: Socket, data: any) {
    const { roomCode, totalQuestion } = data;
    await this.findAndValidateRoomByCode(roomCode);

    socket.broadcast.to(roomCode).emit('startQuiz', { totalQuestion });
  }

  @SubscribeMessage('startQuestion')
  async handleStartQuestion(socket: Socket, data: any) {
    const { roomCode, questionId } = data;

    await this.findAndValidateRoomByCode(roomCode);

    const question = await this.quizzesService.findQuestionsById(questionId);

    socket.broadcast.to(roomCode).emit('startQuestion', { question });
  }

  @SubscribeMessage('answerQuestion')
  async handleAnswerQuestion(socket: Socket, data: any) {
    const { roomCode } = data;
    const { hostUser } = await this.getHostByRoomCode(roomCode);

    if (hostUser) {
      const { socketId } = hostUser;
      socket.to(socketId).emit('newUserAnswer');
    }
  }

  @SubscribeMessage('endQuestion')
  async handleEndQuestion(socket: Socket, data: any) {
    const { roomCode } = data;
    await this.findAndValidateRoomByCode(roomCode);

    socket.broadcast.to(roomCode).emit('endQuestion');
  }

  @SubscribeMessage('endQuiz')
  async handleEndQuiz(socket: Socket, data: any) {
    const { roomCode } = data;
    await this.findAndValidateRoomByCode(roomCode);

    socket.broadcast.to(roomCode).emit('endQuiz');
  }

  async handleDisconnect(socket: Socket) {
    for (let i = 0; i < this.listActiveRoom?.length; i++) {
      this.listActiveRoom[i] = this.listActiveRoom[i]?.filter((userInRoom) => {
        const { socketId } = userInRoom;
        return socketId !== socket?.id;
      });

      if (this.listActiveRoom[i]?.length === 0) {
        this.listActiveRoom?.splice(i, 1);
      }
    }

    console.log(this.listActiveRoom);
  }
}
