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
const nodemailer = require('nodemailer');
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
// const passport = require('passport');
// ✅ Pass app and passport to authRoutes
require("dotenv").config();
require("./passport");
const authRoutes = require("./authRoutes");
const User = require("./models/User");
const Room = require("./models/Room");
const axios = require("axios");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const helmet = require('helmet');
app.use(helmet());
const compression = require('compression');
app.use(compression());
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

// Setup the logger
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev')); // Log to console in development
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  });
});
// require("./authRoutes")(app, passport);
// MongoDB Connection
let db; // global
app.set("trust proxy", 1); // ✅ Trust first proxy for secure cookies
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected via Mongoose");
    db = mongoose.connection.db; // ✅ extract raw DB for room_history
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// const io = new Server(server, {
//   cors: {
//     origin: [
//       "https://codewithfriends.vercel.app",
//       "http://localhost:3000",
//     ],
//     credentials: true,
//   },
//   transports: ["websocket", "polling"],
// });
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000, // Increase timeout for production
  pingInterval: 25000,
  cookie: process.env.NODE_ENV === "production"
});

// Handle Socket.IO connection errors
io.engine.on("connection_error", (err) => {
  console.log("Socket.IO connection error:", err);
});

// Middleware
// app.use(
//   cors({
//     origin: [
//       "http://localhost:3000", // ✅ local development
//       "https://codewithfriends.vercel.app", // ✅ deployed frontend
//     ],
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );
const allowedOrigins = [
  "https://codewithfriends.vercel.app",
  "https://www.codewithfriends.vercel.app",
  "http://localhost:3000" // Keep for development
];

app.use(
  cors({
    origin: function(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["Content-Range", "X-Content-Range"]
  })
);
// Security headers
app.use((req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Set security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  
  // CORS headers
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  
  next();
});
const rateLimit = require('express-rate-limit');

// General rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests, please try again later'
});
app.use(['/auth/login', '/auth/register'], authLimiter);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (err.message.includes('CORS')) {
    return res.status(403).json({ 
      error: 'Not allowed by CORS',
      message: err.message 
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});
// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'SESSION_SECRET', 'EMAIL_USER', 'EMAIL_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Handle process termination
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('Mongoose connection closed through app termination');
    process.exit(0);
  });
});
app.use(express.json());
// --when localhosty uncomment this below session
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "fallbacksecret",
//     resave: false,
//     saveUninitialized: true,
//     cookie: {
//       secure: false,
//       // secure: process.env.NODE_ENV === "production",
//       httpOnly: true,
//       // sameSite: "none",
//       sameSite: "lax", // ✅ Use lax for local dev
//       maxAge: 24 * 60 * 60 * 1000, // 1 day
//     },
    // mjat hjwn mnen libb
// --for production
// app.use(session({
//   secret: process.env.SESSION_SECRET||"fallbacksecret",
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//     // secure: true,
//    secure:process.env.NODE_ENV==="production",
//     httpOnly: true,
//     sameSite: 'none',
//     maxAge: 24 * 60 * 60 * 1000 // 1 day
//   }
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'cow.sid', // Custom session cookie name
  proxy: true, // Trust the reverse proxy
  cookie: {
    secure: process.env.NODE_ENV === "production", // true in production
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    domain: process.env.NODE_ENV === "production" ? '.yourdomain.com' : undefined
  },
  store: new (require('connect-mongodb-session')(session))({
    uri: process.env.MONGO_URI,
    collection: 'sessions'
  })
})
);
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRoutes);
const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'codewithfriends19@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  },
  tls: {
    rejectUnauthorized: false
  }
};
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "Please fill in all fields" });
  }

  const mailOptions = {
    from: `"${name}" <${process.env.EMAIL_USER || 'codewithfriends19@gmail.com'}>`,
    to: process.env.EMAIL_USER || 'codewithfriends19@gmail.com',
    replyTo: email,
    subject: 'New Contact Form Submission - CodeWithFriends',
    text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      </div>
    `
  };

  try {
    const transporter = nodemailer.createTransport(emailConfig);
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send message. Please try again later."
    });
  }
});
// Profile Route
app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    let user = {
      displayName: req.user.displayName || req.user.name,
      email: req.user.emails?.[0]?.value || req.user.email,
      photos: req.user.photos || []
    };
    // console.log("User profile:", user);
    // ✅ Return user profile
    // res.json(user);
    // ✅ Return user profile with emails
    res.json({ displayName: user.displayName,
      email: user.email,
      photos: user.photos,
      emails: req.user.emails || [] }); // ✅ Include emails
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
});



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

// In server.js, update the run-code endpoint
// In server.js, update the run-code endpoint
app.post("/run-code", async (req, res) => {
  const { source_code, stdin, language_id, roomId } = req.body;

  // Add validation
  if (!source_code || !language_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Convert source code to base64
    const base64Source = Buffer.from(source_code).toString('base64');
    const base64Stdin = stdin ? Buffer.from(stdin).toString('base64') : '';

    const options = {
      method: 'POST',
      url: 'https://judge0.p.rapidapi.com/submissions',
      params: { 
        base64_encoded: 'true',  // Enable base64 encoding
        fields: '*',
        wait: 'true'
      },
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
      },
      data: {
        source_code: base64Source,
        stdin: base64Stdin,
        language_id: parseInt(language_id)
      }
    };

    const submission = await axios.request(options);
    const result = submission.data;

    // Helper function to decode base64 if needed
    const decodeIfBase64 = (str) => {
      if (!str) return '';
      try {
        // If it's base64, decode it
        return Buffer.from(str, 'base64').toString('utf-8');
      } catch (e) {
        // If not base64, return as is
        return str;
      }
    };

    // Get the most relevant output
    const output = 
      decodeIfBase64(result.stderr) || 
      decodeIfBase64(result.compile_output) || 
      decodeIfBase64(result.stdout) || 
      "No output";

    if (roomId && io) {
      // Send the first 1000 characters to avoid very large outputs
      io.to(roomId).emit("code-output", output.substring(0, 1000));
    }
    res.json({ message: "Code executed" });

  } catch (error) {
    console.error("Judge0 Error:", error.response?.data || error.message);
    let errorMessage = error.response?.data?.error || error.message;
    
    // Format the error message to be more readable
    if (error.response?.data?.message) {
      errorMessage = `Line ${error.response.data.line || 'unknown'}: ${error.response.data.message}`;
    }
    
    if (roomId && io) {
      io.to(roomId).emit("code-output", `Error: ${errorMessage}`);
    }
    res.status(500).json({ 
      error: "Code execution failed", 
      details: errorMessage 
    });
  }
});
io.on('connection', (socket) => {
  console.log('✅ New socket connected:', socket.id);


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

 const alreadyJoined = await db.collection("room_history").findOne({
  roomId,
  userEmail: email
});

if (!alreadyJoined) {
  // Fetch room creation date from Room model
  const roomData = await Room.findOne({ roomId });

  await db.collection("room_history").insertOne({
    roomId,
    createdBy,
    creatorName: creatorNameToStore,
    userEmail: email,
    timestamp: new Date(), // when the user joined
    roomCreatedAt: roomData?.createdAt || new Date() // ✅ Add this
  });

  console.log(`📝 Saved to room_history for ${email}`);
} else {
  console.log(`🔁 Skipped duplicate entry for ${email} in ${roomId}`);
}

    console.log(`📝 Saved to room_history for ${email}`);
  } catch (err) {
    console.error("❌ Failed to insert into room_history:", err);
  }

  const sockets = await io.in(roomId).fetchSockets();
  const users = sockets.map(s => s.data.username);
  io.to(roomId).emit('room-users', users);
  socket.emit('init-code', room.codeContent || "");
  console.log(`🧠 ${username} joined ${roomId}`);
});


  // ✅ Moved everything inside here 👇
  // socket.on('send-code', async ({ roomId, code }) => {
  //   await Room.findOneAndUpdate({ roomId }, { codeContent: code });
  //   socket.to(roomId).emit('code-update', code);
  // });
socket.on('send-code', async ({ roomId, code, sender }) => {
  await Room.findOneAndUpdate({ roomId }, { codeContent: code });
  socket.to(roomId).emit('code-update', { code, sender });
});
socket.on('code-update', async ({ roomId, code }) => {
  console.log("Server received code-update:", code);
  await Room.findOneAndUpdate({ roomId }, { codeContent: code });
  socket.to(roomId).emit('code-update', { code, sender: socket.id });
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
app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    let user = {
      displayName: req.user.displayName || req.user.name,
      email: req.user.emails?.[0]?.value || req.user.email,
      photos: req.user.photos || []
    };
    res.json(user);
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
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
