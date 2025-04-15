import MyServer from './Client'

const PORT = process.env.PORT || 3333

const server = new MyServer()

server.startServer(Number(PORT))
