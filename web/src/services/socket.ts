import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('accessToken')
    socket = io('/messages', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function emitTyping(matchId: string) {
  getSocket().emit('typing', { matchId })
}

export function emitStopTyping(matchId: string) {
  getSocket().emit('stop_typing', { matchId })
}

export function getUserId(): string {
  const token = localStorage.getItem('accessToken')
  if (!token) return ''
  return JSON.parse(atob(token.split('.')[1])).sub
}
