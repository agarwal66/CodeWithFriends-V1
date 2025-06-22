// const express = require('express');
// const session = require('express-session');
// const passport = require('passport');
// const cors = require('cors');
// const http = require('http');
// require('dotenv').config();
// require('./passport');
// const authRoutes = require('./authRoutes');

// const app = express();
// const server = http.createServer(app);

// app.use(cors({
//   origin: 'http://localhost:3000',
//   credentials: true
// }));

// app.use(session({
//   secret: 'codewithfriends_secret',
//   resave: false,
//   saveUninitialized: true
// }));

// app.use(passport.initialize());
// app.use(passport.session());

// app.use('/auth', authRoutes);

// app.get('/profile', (req, res) => {
//   if (req.isAuthenticated()) {
//     res.json(req.user);
//   } else {
//     res.status(401).json({ message: 'Not logged in' });
//   }
// });

// const { Server } = require('socket.io');
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     credentials: true,
//   },
//   transports: ["websocket", "polling"]  // ✅ Add this line
// });



// io.on('connection', (socket) => {
//   console.log('✅ New socket connected:', socket.id);

//   socket.on('join-room', (roomId) => {
//     socket.join(roomId);
//     console.log(`📢 Socket ${socket.id} joined room ${roomId}`);
//   });

//   socket.on('send-code', ({ roomId, code }) => {
//     // console.log(`🔁 Code from ${socket.id} in ${roomId}:`, code);
//     socket.to(roomId).emit('code-update', code);
//   });

//   socket.on('disconnect', () => {
//     console.log(`❌ Socket disconnected: ${socket.id}`);
//   });
// });

// server.listen(4000, () => {
//   console.log('✅ Server running on http://localhost:4000');
// });
// --------

// app.get("/room/:id", async (req, res) => {
//   const roomId = req.params.id;
//   try {
//     const room = await Room.findOne({ roomId });
//     if (room) {
//       res.json(room);
//     } else {
//       res.status(404).json({ error: "Room not found" });
//     }
//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// });
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();
require('./passport');
const authRoutes = require('./authRoutes');
const User = require('./models/User');
const Room = require('./models/Room');
const axios = require('axios');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');

// MongoDB Connection
let db; // global

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ MongoDB Connected via Mongoose");
  db = mongoose.connection.db; // ✅ extract raw DB for room_history
})
.catch((err) => console.error("❌ MongoDB connection error:", err));

// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// let db; // 👈 define globally

// client.connect().then(() => {
//   db = client.db();
// .then(() => console.log("✅ MongoDB Connected"))
// .catch((err) => console.error("❌ MongoDB connection error:", err));
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
  transports: ['websocket', 'polling']
});


// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
  }
}));
// app.use(session({
//   secret: 'codewithfriends_secret',
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//     secure: false,
//     httpOnly: false,
//     sameSite: 'lax',
//   }
// }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRoutes);

// Profile Route
app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);  // ✅ yeh hona chahiye
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
});

// Rooms route to fetch user’s past collabs
// app.get('/user-rooms', async (req, res) => {
//   if (!req.isAuthenticated()) {
//     return res.status(401).json({ error: 'Not logged in' });
//   }

//   const rooms = await Room.find({ participants: req.user.email });
//   res.json(rooms);
// });
// app.get('/user-rooms', async (req, res) => {
//   const email = req.user?.emails?.[0]?.value;
//   const rooms = await db.collection('rooms')
//     .find({ userEmail: email })
//     .sort({ timestamp: -1 })
//     .toArray();

//   res.json(rooms); // ✅ must return full array
// });
// app.get("/room-history", async (req, res) => {
//   try {
//     const email = req.user?.email; // or however you're storing it
//     const history = await db.collection("room_history").find({ email }).toArray();
//     res.json(history); // ✅ Only send plain data
//   } catch (err) {
//     console.error("Error fetching room history:", err);
//     res.status(500).json({ error: "Failed to fetch history" });
//   }
// });

app.get("/room-history", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const email = req.user.emails?.[0]?.value;
    const rooms = await db.collection("room_history")
      .find({ userEmail: email })
      .sort({ timestamp: -1 })
      .toArray();

    res.json(rooms);
  } catch (err) {
    console.error("❌ Failed to fetch room history:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});



app.get('/user-rooms', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const email = req.user.emails[0].value;

  try {
    const db = mongoose.connection.db; // ✅ FIXED
    const rooms = await db.collection('room_history')
    const history = await db.collection('room_history')  
    .find({ userEmail: email })
      .sort({ timestamp: -1 })
      .toArray();
    res.json(history);
    res.json(rooms);
  } catch (err) {
    console.error("❌ Failed to fetch room history:", err);
    res.status(500).json({ error: "Failed to fetch room history" });
  }
});


app.get("/room/:id", async (req, res) => {
  const roomId = req.params.id;
  try {
    const room = await Room.findOne({ roomId });
    if (room) {
      res.json({
        codeContent: room.codeContent,
        chatHistory: room.chatHistory || [],
      });
    } else {
      res.status(404).json({ error: "Room not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

console.log("KEY:", process.env.RAPIDAPI_KEY);
console.log("HOST:", process.env.RAPIDAPI_HOST);

app.post("/run-code", async (req, res) => {
  const { source_code, stdin, language_id, roomId } = req.body;

  const options = {
    method: 'POST',
    url: 'https://judge0.p.rapidapi.com/submissions',
    params: { base64_encoded: 'false', fields: '*' },
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
    },
    data: {
      source_code,
      stdin,
      language_id
    }
  };

  try {
    const submission = await axios.request(options);
    const token = submission.data.token;

    // ✅ Immediately respond so headers are not sent twice
    res.json({ message: "Code execution started" });

    // ⏳ Wait and then fetch result
    setTimeout(async () => {
      try {
        const result = await axios.get(
          `https://judge0.p.rapidapi.com/submissions/${token}`,
          {
            params: { base64_encoded: 'false', fields: '*' },
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
            }
          }
        );

        const output = result.data.stdout || result.data.stderr || result.data.compile_output || "No output";

        // ✅ Emit to everyone in the room
        if (roomId && io) {
          io.to(roomId).emit("code-output", output);
        }
      } catch (fetchErr) {
        console.error("Error fetching Judge0 result:", fetchErr.message);
      }
    }, 3000);
  } catch (error) {
    console.error("Judge0 Submission Error:", error.message);
    res.status(500).json({ error: "Code submission failed" });
  }
});




// app.get("/room/:id", async (req, res) => {
//   const roomId = req.params.id;
//   try {
//     const room = await Room.findOne({ roomId });
//     if (room) {
//       res.json(room);
//     } else {
//       res.status(404).json({ error: "Room not found" });
//     }
//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// Socket.IO
// Socket.IO
io.on('connection', (socket) => {
  console.log('✅ New socket connected:', socket.id);

  // Existing listeners like join-room, send-code, etc.
// socket.on('join-room', async ({ roomId, username, email }) => {
//   socket.join(roomId);
//   socket.data.username = username;

//   let room = await Room.findOne({ roomId });
//   if (!room) {
//     room = await Room.create({
//       roomId,
//       createdBy: email,
//       participants: [email],
//       codeContent: "",
//     });
//   } else if (!room.participants.includes(email)) {
//     room.participants.push(email);
//     await room.save();
//   }

//   try {
//     await db.collection("room_history").insertOne({
//   roomId,
//   createdBy: email,
//   creatorName: username || "Anonymous",
//   createdAt: new Date(),
//   userEmail: email,
//   timestamp: new Date()
// });

//     console.log(`📝 Saved to room_history for ${email}`);
//   } catch (err) {
//     console.error("❌ Failed to insert into room_history:", err);
//   }

//   const sockets = await io.in(roomId).fetchSockets();
//   const users = sockets.map(s => s.data.username);
//   io.to(roomId).emit('room-users', users);

//   console.log(`🧠 ${username} joined ${roomId}`);
// });

socket.on('join-room', async ({ roomId, username, email }) => {
  socket.join(roomId);
  socket.data.username = username;

  let room = await Room.findOne({ roomId });
  if (!room) {
    room = await Room.create({
      roomId,
      createdBy: email,
      participants: [email],
      codeContent: "",
    });
  } else if (!room.participants.includes(email)) {
    room.participants.push(email);
    await room.save();
  }

  try {
    // Check if room already has an entry in room_history
    const existing = await db.collection("room_history").findOne({ roomId });

    let creatorNameToStore = username || "Anonymous";
    let createdBy = email;

    if (existing) {
      // Use original creator info
      creatorNameToStore = existing.creatorName;
      createdBy = existing.createdBy;
    }

    await db.collection("room_history").insertOne({
      roomId,
      createdBy,
      creatorName: creatorNameToStore,
      userEmail: email,
      timestamp: new Date()
    });

    console.log(`📝 Saved to room_history for ${email}`);
  } catch (err) {
    console.error("❌ Failed to insert into room_history:", err);
  }

  const sockets = await io.in(roomId).fetchSockets();
  const users = sockets.map(s => s.data.username);
  io.to(roomId).emit('room-users', users);

  console.log(`🧠 ${username} joined ${roomId}`);
});


  // ✅ Moved everything inside here 👇
  socket.on('send-code', async ({ roomId, code }) => {
    await Room.findOneAndUpdate({ roomId }, { codeContent: code });
    socket.to(roomId).emit('code-update', code);
  });

  socket.on('user-typing', ({ roomId, username }) => {
    socket.to(roomId).emit('user-typing', username);
  });

  socket.on('send-message', async ({ roomId, sender, message }) => {
    await Room.findOneAndUpdate(
      { roomId },
      { $push: { chatHistory: { sender, message } } }
    );
    socket.to(roomId).emit('receive-message', { sender, message });
  });

  // ✅ Voice features
  socket.on("voice-offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("voice-offer", { offer });
  });

  socket.on("voice-answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("voice-answer", { answer });
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  socket.on('disconnect', async () => {
  const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
  for (const roomId of rooms) {
    const sockets = await io.in(roomId).fetchSockets();
    const users = sockets.map(s => s.data.username);
    io.to(roomId).emit('room-users', users);
  }
  console.log(`❌ Socket disconnected: ${socket.id}`);
});

});


// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     credentials: true,
//   },
//   transports: ['websocket', 'polling']
// });

// io.on('connection', (socket) => {
//   console.log('✅ New socket connected:', socket.id);

//   // Join room
//   socket.on('join-room', async ({ roomId, username, email }) => {
//     socket.join(roomId);

//     let room = await Room.findOne({ roomId });
//     if (!room) {
//       room = await Room.create({
//         roomId,
//         createdBy: email,
//         participants: [email],
//         codeContent: "",
//       });
//     } else if (!room.participants.includes(email)) {
//       room.participants.push(email);
//       await room.save();
//     }

//     console.log(`🧠 ${username} joined ${roomId}`);
//   });

//   // Sync code + Save
//    socket.on('send-code', async ({ roomId, code }) => {
//     console.log(`✏️ Code received from ${socket.id} for ${roomId}`);
//     await Room.findOneAndUpdate({ roomId }, { codeContent: code });
//     socket.to(roomId).emit('code-update', code);
//   });

//   // Typing notification
//   socket.on('user-typing', ({ roomId, username }) => {
//     socket.to(roomId).emit('user-typing', username);
//   });

//   // Chat message
// socket.on('send-message', async ({ roomId, sender, message }) => {
//   await Room.findOneAndUpdate(
//     { roomId },
//     { $push: { chatHistory: { sender, message } } }
//   );
//   socket.to(roomId).emit('receive-message', { sender, message });
// });


//   // Disconnect
//   socket.on('disconnect', () => {
//     console.log(`❌ Socket disconnected: ${socket.id}`);
//   });
// });

// Start server
server.listen(4000, () => {
  console.log('🚀 Server running on http://localhost:4000');
});
