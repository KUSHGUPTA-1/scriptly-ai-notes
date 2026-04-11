// Chat widget client
(() => {
  // Determine backend base URL. If frontend is served from a dev Live Server (e.g. port 5500),
  // requests should go to the backend on port 5000 by default. You can override by setting
  // `window.SCRIPTLY_BACKEND` (e.g. in a page script) to a full origin like 'http://localhost:5000'.
  const defaultBackend = (() => {
    try {
      const host = window.location.hostname;
      // If we're running on localhost/127.0.0.1 and the port is not the backend port,
      // assume backend runs on 5000 (common for this project).
      if (host === 'localhost' || host === '127.0.0.1') {
        return window.location.protocol + '//' + host + ':5000';
      }
    } catch (e) {
      // fallback
    }
    return window.location.origin;
  })();
  const baseUrl = window.SCRIPTLY_BACKEND || defaultBackend; // use override if provided

  function q(sel) { return document.querySelector(sel); }

  // Create widget elements
  const btn = document.createElement('button');
  btn.className = 'chatbot-btn';
  btn.title = 'Open chat';
  btn.innerHTML = '<span class="chat-icon">💬</span>';

  const win = document.createElement('div');
  win.className = 'chat-window hidden';
  win.innerHTML = `
    <div class="chat-header">Scriptly Chat <button class="chat-close">✕</button></div>
    <div class="chat-messages" role="log"></div>
    <div class="chat-input-wrap">
      <input class="chat-input" placeholder="Ask Scriptly..." />
      <button class="chat-send">Send</button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(win);

  const messagesEl = win.querySelector('.chat-messages');
  const inputEl = win.querySelector('.chat-input');
  const sendBtn = win.querySelector('.chat-send');
  const closeBtn = win.querySelector('.chat-close');

  function openChat(){ win.classList.remove('hidden'); btn.classList.add('open'); inputEl.focus(); }
  function closeChat(){ win.classList.add('hidden'); btn.classList.remove('open'); }

  btn.addEventListener('click', () => {
    if (win.classList.contains('hidden')) openChat(); else closeChat();
  });
  closeBtn.addEventListener('click', closeChat);

  function appendMessage(text, cls){
    const m = document.createElement('div');
    m.className = 'chat-msg ' + (cls||'');
    m.textContent = text;
    messagesEl.appendChild(m);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendMessage(){
    const text = inputEl.value.trim();
    if(!text) return;
    appendMessage(text, 'user');
    inputEl.value = '';
    const loadingEl = document.createElement('div');
    loadingEl.className = 'chat-msg loading';
    loadingEl.textContent = '...';
    messagesEl.appendChild(loadingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try{
      const resp = await fetch(baseUrl + '/api/chat', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ message: text })
      });

      // remove the loading indicator if present
      const loading = messagesEl.querySelector('.chat-msg.loading');
      if(loading) loading.remove();

      if (!resp.ok) {
        // Try to parse error details, but handle empty/non-json bodies
        let errText = `${resp.status} ${resp.statusText}`;
        try {
          const errJson = await resp.json();
          if (errJson?.error) errText += ` - ${errJson.error}`;
        } catch (e) {
          // ignore JSON parse error
        }
        appendMessage('Chat error: ' + errText, 'bot');
        return;
      }

      // parse JSON safely
      let data = null;
      try {
        data = await resp.json();
      } catch (e) {
        appendMessage('Chat error: Empty or invalid JSON response from server', 'bot');
        return;
      }

      if (data?.reply) appendMessage(data.reply, 'bot');
      else appendMessage('Chat error: No reply field in server response', 'bot');
    }catch(err){
      const loading = messagesEl.querySelector('.chat-msg.loading');
      if(loading) loading.remove();
      appendMessage('Chat error: ' + (err.message||err), 'bot');
      console.error(err);
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') sendMessage(); });

  // expose small API to open chat from other scripts
  window.ScriptlyChat = { open: openChat, close: closeChat };
})();
