const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 8 * 1024 * 1024 // allow base64 file payloads through sockets
});

const conversations = {};
const agentSockets = new Set();

app.get('/health', (req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  const role = socket.handshake.query.role;

  if (role === 'agent') {
    agentSockets.add(socket.id);
    socket.join('agents');
    socket.emit('conversation_list', conversations);

    socket.on('agent_message', ({ visitorId, text, file }) => {
      const msg = { id: uuidv4(), from: 'agent', text: text || '', file: file || null, ts: Date.now() };
      if (!conversations[visitorId]) return;
      conversations[visitorId].messages.push(msg);
      io.to(visitorId).emit('new_message', msg);
      io.to('agents').emit('conversation_updated', { visitorId, msg });
    });

    socket.on('disconnect', () => agentSockets.delete(socket.id));
    return;
  }

  const visitorId = socket.handshake.query.visitorId || uuidv4();
  socket.join(visitorId);

  if (!conversations[visitorId]) {
    conversations[visitorId] = { visitorId, messages: [], connectedAt: Date.now() };
  }

  socket.emit('init', { visitorId, messages: conversations[visitorId].messages });
  io.to('agents').emit('new_conversation', conversations[visitorId]);

  socket.on('visitor_message', ({ text, file }) => {
    const msg = { id: uuidv4(), from: 'visitor', text: text || '', file: file || null, ts: Date.now() };
    conversations[visitorId].messages.push(msg);
    socket.emit('new_message', msg);
    io.to('agents').emit('conversation_updated', { visitorId, msg });
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
