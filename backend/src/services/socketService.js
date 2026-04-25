const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');

let io = null;

/**
 * Initialize Socket.IO server
 * @param {http.Server} httpServer - HTTP server instance
 */
function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:3000'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ WebSocket client connected: ${socket.id} (User: ${socket.userId})`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join organization room (if implemented)
    // socket.join(`org:${socket.organizationId}`);

    socket.on('disconnect', () => {
      console.log(`❌ WebSocket client disconnected: ${socket.id}`);
    });
  });

  console.log('🔌 WebSocket server initialized');
  return io;
}

/**
 * Get Socket.IO instance
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket() first.');
  }
  return io;
}

/**
 * Emit event to all connected clients
 */
function emitToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

/**
 * Emit event to specific user
 */
function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Emit roster update events
 */
const rosterEvents = {
  staffAssigned: (jobId, staffData) => {
    emitToAll('roster:staff-assigned', { jobId, staff: staffData });
  },

  staffUnassigned: (jobId, staffId, role) => {
    emitToAll('roster:staff-unassigned', { jobId, staffId, role });
  },

  vehicleAssigned: (jobId, vehicleData) => {
    emitToAll('roster:vehicle-assigned', { jobId, vehicle: vehicleData });
  },

  vehicleUnassigned: (jobId, vehicleId) => {
    emitToAll('roster:vehicle-unassigned', { jobId, vehicleId });
  },

  equipmentAssigned: (jobId, equipmentData) => {
    emitToAll('roster:equipment-assigned', { jobId, equipment: equipmentData });
  },

  equipmentUnassigned: (jobId, equipmentId) => {
    emitToAll('roster:equipment-unassigned', { jobId, equipmentId });
  },

  jobUpdated: (jobData) => {
    emitToAll('roster:job-updated', jobData);
  },

  jobCreated: (jobData) => {
    emitToAll('roster:job-created', jobData);
  },

  jobDeleted: (jobId) => {
    emitToAll('roster:job-deleted', { jobId });
  },
};

/**
 * Emit arrangement update events
 */
const arrangementEvents = {
  created: (arrangementData) => {
    emitToAll('arrangement:created', arrangementData);
  },

  updated: (arrangementData) => {
    emitToAll('arrangement:updated', arrangementData);
  },

  deleted: (arrangementId) => {
    emitToAll('arrangement:deleted', { arrangementId });
  },

  statusChanged: (arrangementId, newStatus) => {
    emitToAll('arrangement:status-changed', { arrangementId, status: newStatus });
  },
};

/**
 * Emit message events
 */
const messageEvents = {
  newMessage: (arrangementId, messageData) => {
    emitToAll('message:new', { arrangementId, message: messageData });
  },
};

module.exports = {
  initializeSocket,
  getIO,
  emitToAll,
  emitToUser,
  rosterEvents,
  arrangementEvents,
  messageEvents,
};
