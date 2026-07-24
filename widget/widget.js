(function () {
  const BACKEND_URL = 'http://localhost:3001';

  const script = document.createElement('script');
  script.src = `${BACKEND_URL}/socket.io/socket.io.js`;
  document.head.appendChild(script);

  script.onload = function () {
    let visitorId = localStorage.getItem('support_visitor_id');
    if (!visitorId) {
      visitorId = 'v_' + Math.random().toString(36).slice(2, 11);
      localStorage.setItem('support_visitor_id', visitorId);
    }

    const socket = io(BACKEND_URL, { query: { role: 'visitor', visitorId } });

    const bubble = document.createElement('div');
    bubble.innerHTML = '💬';
    Object.assign(bubble.style, {
      position: 'fixed', bottom: '20px', right: '20px', width: '56px', height: '56px',
      borderRadius: '50%', background: '#f5b400', color: '#111', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontSize: '24px', cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 999999
    });

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      position: 'fixed', bottom: '90px', right: '20px', width: '340px', height: '480px',
      background: '#14151a', borderRadius: '12px', display: 'none', flexDirection: 'column',
      overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', zIndex: 999999,
      fontFamily: 'system-ui, sans-serif', color: '#eee'
    });

    panel.innerHTML = `
      <div style="padding:14px;background:#1c1e26;display:flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;border-radius:50%;background:#f5b400;color:#111;
                    display:flex;align-items:center;justify-content:center;font-weight:600;">CS</div>
        <div>
          <div style="font-weight:600;font-size:14px;">Customer support</div>
          <div style="font-size:12px;color:#8f9;">● Online now</div>
        </div>
      </div>
      <div id="sc-messages" style="flex:1;overflow-y:auto;padding:14px;display:flex;
           flex-direction:column;gap:10px;"></div>
      <div style="padding:10px;display:flex;gap:8px;border-top:1px solid #222;">
        <input id="sc-input" placeholder="Type your message..." style="flex:1;padding:10px;
               border-radius:8px;border:none;background:#22242c;color:#fff;outline:none;" />
        <button id="sc-send" style="width:38px;height:38px;border-radius:50%;border:none;
                background:#f5b400;cursor:pointer;">➤</button>
      </div>
    `;

    document.body.appendChild(bubble);
    document.body.appendChild(panel);

    bubble.onclick = () => {
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    };

    const messagesEl = panel.querySelector('#sc-messages');
    const inputEl = panel.querySelector('#sc-input');
    const sendBtn = panel.querySelector('#sc-send');

    function renderMessage(msg) {
      const row = document.createElement('div');
      const isVisitor = msg.from === 'visitor';
      row.style.alignSelf = isVisitor ? 'flex-end' : 'flex-start';
      row.style.background = isVisitor ? '#f5b400' : '#2a2c36';
      row.style.color = isVisitor ? '#111' : '#eee';
      row.style.padding = '8px 12px';
      row.style.borderRadius = '10px';
      row.style.maxWidth = '80%';
      row.style.fontSize = '14px';
      row.textContent = msg.text;
      messagesEl.appendChild(row);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    socket.on('init', ({ messages }) => {
      if (messages.length === 0) {
        renderMessage({ from: 'agent', text: "Hi there. I'm here to help. What can I do for you today?" });
      } else {
        messages.forEach(renderMessage);
      }
    });

    socket.on('new_message', renderMessage);

    function send() {
      const text = inputEl.value.trim();
      if (!text) return;
      socket.emit('visitor_message', { text });
      inputEl.value = '';
    }

    sendBtn.onclick = send;
    inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  };
})();
