  (function () {
    const script = document.currentScript;
    const API_BASE = new URL(script.src).origin;// update this to your Vercel URL
    const password = script.getAttribute('data-password') || '';
    const title = script.getAttribute('data-title') || 'AI Assistant';
    const color = script.getAttribute('data-color') || '#4f46e5';
    const greeting = script.getAttribute('data-greeting') || '';

    let history = [];

    const style = document.createElement('style');
    style.textContent = `
      #chatboat-widget { position: fixed; bottom: 24px; right: 24px; z-index: 9999; font-family: Arial, sans-serif; }
      #cb-toggle { width: 56px; height: 56px; border-radius: 50%; background: ${color}; color: white; border: none;
  font-size: 24px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
      #cb-panel { width: 320px; height: 420px; background: white; border-radius: 12px; box-shadow: 0 8px 30px
  rgba(0,0,0,0.15); display: flex; flex-direction: column; margin-bottom: 12px; }
      #cb-header { background: ${color}; color: white; padding: 12px 16px; border-radius: 12px 12px 0 0; display: flex;
  justify-content: space-between; align-items: center; font-weight: bold; }
      #cb-close { background: none; border: none; color: white; font-size: 18px; cursor: pointer; }
      #cb-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
      .cb-msg { padding: 8px 12px; border-radius: 10px; max-width: 80%; font-size: 14px; line-height: 1.4; }
      .cb-user { background: ${color}; color: white; align-self: flex-end; }
      .cb-bot { background: #f0f0f0; color: black; align-self: flex-start; }
      #cb-input-row { display: flex; padding: 10px; gap: 8px; border-top: 1px solid #eee; }
      #cb-input { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }
      #cb-send { padding: 8px 14px; background: ${color}; color: white; border: none; border-radius: 6px; cursor:
  pointer; font-size: 14px; }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'chatboat-widget';
    container.innerHTML = `
      <div id="cb-panel" style="display:none; flex-direction:column;">
        <div id="cb-header">
          <span>${title}</span>
          <button id="cb-close">✕</button>
        </div>
        <div id="cb-messages"></div>
        <div id="cb-input-row">
          <input id="cb-input" type="text" placeholder="Type a message..." />
          <button id="cb-send">Send</button>
        </div>
      </div>
      <button id="cb-toggle">💬</button>
    `;
    document.body.appendChild(container);

    document.getElementById('cb-toggle').onclick = () => {
      const panel = document.getElementById('cb-panel');
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    };

    document.getElementById('cb-close').onclick = () => {
      document.getElementById('cb-panel').style.display = 'none';
    };

    function addMsg(text, type) {
      const messages = document.getElementById('cb-messages');
      const el = document.createElement('div');
      el.className = `cb-msg cb-${type}`;
      el.textContent = text;
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
      return el;
    }

    async function send() {
      const input = document.getElementById('cb-input');
      const text = input.value.trim();
      if (!text) return;

      history.push({ role: 'user', content: text });
      addMsg(text, 'user');
      input.value = '';

      const thinking = addMsg('Thinking...', 'bot');

      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, messages: history }),
        });
        const data = await res.json();
        const reply = data.reply || 'No response.';
        thinking.textContent = reply;
        history.push({ role: 'assistant', content: reply });
      } catch {
        thinking.textContent = 'Error connecting.';
      }
    }

    document.getElementById('cb-send').onclick = send;
    if (greeting) addMsg(greeting, 'bot');
    document.getElementById('cb-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') send();
    });
  })();