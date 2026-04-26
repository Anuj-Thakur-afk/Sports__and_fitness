// /frontend/js/chat.js
// Real-time community chat using Socket.IO

let socket = null;
let currentUsername = 'Anonymous';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  // Get user name
  const user = getUser();
  if (user) {
    currentUsername = user.name;
    const usernameEl = document.getElementById('chatUsername');
    if (usernameEl) usernameEl.textContent = currentUsername;
  }

  // Connect Socket.IO
  initSocket();

  // Send button
  document.getElementById('sendBtn').addEventListener('click', sendMessage);

  // Enter key to send
  document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});

/* ===== Initialize Socket.IO ===== */
const initSocket = () => {
  // Connect to the server (same origin)
  socket = io();

  socket.on('connect', () => {
    console.log('✅ Connected to chat server');
    appendSystemMsg('Connected to FitLife Community Chat 🎉');
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from chat server');
    appendSystemMsg('Disconnected from chat. Reconnecting...');
  });

  // Receive chat history on join
  socket.on('chat:history', (messages) => {
    const container = document.getElementById('chatMessages');
    // Clear default welcome if we have history
    if (messages.length > 0) {
      container.innerHTML = '';
      messages.forEach(msg => renderMessage(msg));
      scrollToBottom();
    }
  });

  // Receive new messages
  socket.on('chat:message', (msg) => {
    renderMessage(msg);
    scrollToBottom();
  });

  socket.on('connect_error', () => {
    appendSystemMsg('⚠️ Connection error. Please refresh the page.');
  });
};

/* ===== Send a message ===== */
const sendMessage = () => {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();

  if (!text) return;
  if (text.length > 300) {
    showToast('Message too long (max 300 chars).', 'error');
    return;
  }
  if (!socket || !socket.connected) {
    showToast('Not connected to chat server.', 'error');
    return;
  }

  socket.emit('chat:message', {
    user: currentUsername,
    text,
  });

  input.value = '';
  input.focus();
};

/* ===== Render a chat message ===== */
const renderMessage = (msg) => {
  const container = document.getElementById('chatMessages');
  const isOwn = msg.user === currentUsername;

  const msgEl = document.createElement('div');
  msgEl.className = `chat-msg ${isOwn ? 'own' : 'other'}`;
  msgEl.innerHTML = `
    <div class="chat-bubble">${escapeHtmlChat(msg.text)}</div>
    <div class="chat-meta">
      ${!isOwn ? `<span><strong>${escapeHtmlChat(msg.user)}</strong></span>` : ''}
      <span>${msg.time || ''}</span>
    </div>
  `;

  container.appendChild(msgEl);
};

/* ===== Append a system/status message ===== */
const appendSystemMsg = (text) => {
  const container = document.getElementById('chatMessages');
  const el = document.createElement('div');
  el.className = 'system-msg';
  el.textContent = text;
  container.appendChild(el);
  scrollToBottom();
};

/* ===== Scroll chat to bottom ===== */
const scrollToBottom = () => {
  const container = document.getElementById('chatMessages');
  container.scrollTop = container.scrollHeight;
};

/* ===== Escape HTML for chat messages ===== */
const escapeHtmlChat = (str) => {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
};
