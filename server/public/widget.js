(function () {
  const BACKEND_URL = 'https://support-chat-f8jt.onrender.com';
  const ACCENT = '#FCD535';
  const ACCENT_DARK = '#111';
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

    const styleTag = document.createElement('style');
    styleTag.textContent = `
      @keyframes sc-pop-in {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes sc-bubble-in {
        from { opacity: 0; transform: scale(0.6); }
        to { opacity: 1; transform: scale(1); }
      }
      #sc-messages::-webkit-scrollbar { width: 6px; }
      #sc-messages::-webkit-scrollbar-thumb { background: #333644; border-radius: 10px; }
      #sc-messages::-webkit-scrollbar-track { background: transparent; }
      #sc-bubble:hover { transform: scale(1.06); box-shadow: 0 6px 22px rgba(252,213,53,0.35); }
      #sc-send:hover, #sc-attach:hover { filter: brightness(1.08); }
      #sc-input::placeholder { color: #6b6f7d; }
      .sc-file-link { display:flex; align-items:center; gap:8px; text-decoration:none; }
      .sc-img-preview { max-width: 100%; border-radius: 10px; display:block; cursor:pointer; }
    `;
    document.head.appendChild(styleTag);

    const bubble = document.createElement('div');
    bubble.id = 'sc-bubble';
    bubble.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16v12H7l-3 3V4z" stroke="#111" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      </svg>
    `;
    Object.assign(bubble.style, {
      position: 'fixed', bottom: '20px', right: '20px', width: '58px', height: '58px',
      borderRadius: '50%', background: ACCENT, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.35)', zIndex: 999999,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      animation: 'sc-bubble-in 0.25s ease'
    });

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      position: 'fixed', bottom: '90px', right: '20px', width: '360px', height: '500px',
      background: '#16171d', borderRadius: '16px', display: 'none', flexDirection: 'column',
      overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 999999,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#e8e8ec', border: '1px solid #23252e',
      animation: 'sc-pop-in 0.2s ease'
    });

    panel.innerHTML = `
      <div style="padding:16px 18px;background:#1b1c24;display:flex;align-items:center;gap:12px;border-bottom:1px solid #23252e;">
        <img src="/binance-icon-logo-png_seeklogo-598330.png" alt="Binance" style="width:38px;height:38px;border-radius:50%;
                    background:#fff;object-fit:cover;" />
        <div style="flex:1;">
          <div style="font-weight:600;font-size:14.5px;letter-spacing:0.2px;">Binance Support</div>
          <div style="font-size:12px;color:#4ade80;display:flex;align-items:center;gap:5px;margin-top:2px;">
            <span style="width:6px;height:6px;border-radius:50%;background:#4ade80;display:inline-block;"></span>
            Online now
          </div>
        </div>
        <div id="sc-close" style="cursor:pointer;color:#6b6f7d;font-size:18px;padding:4px;line-height:1;">&times;</div>
      </div>
      <div id="sc-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;
           flex-direction:column;gap:12px;background:#16171d;"></div>
      <div style="padding:12px;display:flex;gap:8px;border-top:1px solid #23252e;background:#1b1c24;">
        <input id="sc-file-input" type="file" accept="image/*,.pdf,.doc,.docx,.txt" style="display:none;" />
        <button id="sc-attach" title="Attach file" style="width:40px;height:40px;border-radius:10px;border:1px solid #2a2c36;flex-shrink:0;
                background:#22242c;cursor:pointer;display:flex;align-items:center;justify-content:center;
                transition:filter 0.15s ease;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M21 10.5l-8.4 8.4a4.5 4.5 0 01-6.36-6.36l8.4-8.4a3 3 0 014.24 4.24l-8.4 8.4a1.5 1.5 0 01-2.12-2.12l7.37-7.37"
                  stroke="${ACCENT}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <input id="sc-input" placeholder="Type your message..." style="flex:1;padding:11px 14px;
               border-radius:10px;border:1px solid #2a2c36;background:#22242c;color:#fff;outline:none;
               font-size:14px;transition:border-color 0.15s ease;" />
        <button id="sc-send" style="width:40px;height:40px;border-radius:10px;border:none;flex-shrink:0;
                background:${ACCENT};cursor:pointer;display:flex;align-items:center;justify-content:center;
                transition:filter 0.15s ease;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M20 12L4 4l6 8-6 8 16-8z" fill="${ACCENT_DARK}"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(bubble);
    document.body.appendChild(panel);

    bubble.onclick = () => {
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    };
    panel.querySelector('#sc-close').onclick = () => {
      panel.style.display = 'none';
    };

    const inputEl = panel.querySelector('#sc-input');
    inputEl.addEventListener('focus', () => { inputEl.style.borderColor = ACCENT; });
    inputEl.addEventListener('blur', () => { inputEl.style.borderColor = '#2a2c36'; });

    const messagesEl = panel.querySelector('#sc-messages');
    const sendBtn = panel.querySelector('#sc-send');
    const attachBtn = panel.querySelector('#sc-attach');
    const fileInput = panel.querySelector('#sc-file-input');

    function renderMessage(msg) {
      const row = document.createElement('div');
      const isVisitor = msg.from === 'visitor';
      row.style.alignSelf = isVisitor ? 'flex-end' : 'flex-start';
      row.style.background = isVisitor ? ACCENT : '#24262f';
      row.style.color = isVisitor ? ACCENT_DARK : '#e8e8ec';
      row.style.padding = msg.file && msg.file.type && msg.file.type.startsWith('image/') ? '6px' : '9px 13px';
      row.style.borderRadius = isVisitor ? '12px 12px 2px 12px' : '12px 12px 12px 2px';
      row.style.maxWidth = '78%';
      row.style.fontSize = '14px';
      row.style.lineHeight = '1.4';
      row.style.wordBreak = 'break-word';

      if (msg.file) {
        if (msg.file.type && msg.file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = msg.file.dataUrl;
          img.className = 'sc-img-preview';
          img.onclick = () => window.open(msg.file.dataUrl, '_blank');
          row.appendChild(img);
        } else {
          const link = document.createElement('a');
          link.href = msg.file.dataUrl;
          link.download = msg.file.name;
          link.className = 'sc-file-link';
          link.style.color = isVisitor ? ACCENT_DARK : '#e8e8ec';
          link.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="2"/>
              <path d="M14 2v6h6" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>${msg.file.name}</span>
          `;
          row.appendChild(link);
        }
        if (msg.text) {
          const caption = document.createElement('div');
          caption.textContent = msg.text;
          caption.style.marginTop = '6px';
          row.appendChild(caption);
        }
      } else {
        row.textContent = msg.text;
      }

      messagesEl.appendChild(row);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    socket.on('init', ({ messages }) => {
      if (messages.length === 0) {
        renderMessage({ from: 'agent', text: "Welcome to customer support. I’m your Binance assistant. How can I help you today?" });
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

    attachBtn.onclick = () => fileInput.click();

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        alert('File is too large. Max size is 5MB.');
        fileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        socket.emit('visitor_message', {
          text: '',
          file: { name: file.name, type: file.type, dataUrl: reader.result }
        });
      };
      reader.readAsDataURL(file);
      fileInput.value = '';
    });
  };
})();
