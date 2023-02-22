import path from 'path';
import { cwd } from 'node:process';
import { Server } from 'socket.io';
import { createServer } from 'http';

export default () => {
  const httpServer = createServer();
  const io = new Server(8890, {
    cors: {
      origin: '*',
      // or with an array of origins
      // origin: ["https://my-frontend.com", "https://my-other-frontend.com", "http://localhost:3000"],
    },
  });

  io.on('connection', socket => {
    // ...
    console.log('on');
  });
  console.log(io);

  return {
    name: 'vite-plugin-br-ext-reload',
    enforce: 'post',

    closeBundle() {
      io.send('file.change');
    },
  };
};
