import { useState, useRef, useEffect } from 'react';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --surface: #13131a;
    --surface2: #1c1c27;
    --border: #2a2a3d;
    --accent: #7c6ff7;
    --accent2: #f7936f;
    --text: #e8e8f0;
    --muted: #6b6b82;
    --user-bg: linear-gradient(135deg, #7c6ff7, #9d79f7);
    --bot-bg: #1c1c27;
  }

  body { background: var(--bg); font-family: 'Syne', sans-serif; }

  .chat-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg);
    position: relative;
    overflow: hidden;
  }

  .bg-grid {
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(124,111,247,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124,111,247,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .bg-glow {
    position: fixed;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(124,111,247,0.08) 0%, transparent 70%);
    top: -200px;
    right: -200px;
    pointer-events: none;
    z-index: 0;
  }

  .header {
    position: relative;
    z-index: 10;
    padding: 20px 28px;
    border-bottom: 1px solid var(--border);
    background: rgba(10,10,15,0.8);
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .header-icon {
    width: 38px;
    height: 38px;
    background: var(--user-bg);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
    box-shadow: 0 0 20px rgba(124,111,247,0.4);
  }

  .header-title {
    font-size: 18px;
    font-weight: 800;
    color: var(--text);
    letter-spacing: -0.3px;
  }

  .header-sub {
    font-size: 11px;
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    margin-top: 1px;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    background: #4ade80;
    border-radius: 50%;
    margin-left: auto;
    box-shadow: 0 0 8px #4ade80;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.85); }
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    z-index: 1;
    scroll-behavior: smooth;
  }

  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-track { background: transparent; }
  .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--muted);
    text-align: center;
    padding: 40px;
  }

  .empty-icon { font-size: 48px; opacity: 0.4; }

  .empty-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
    opacity: 0.5;
  }

  .empty-sub {
    font-size: 13px;
    font-family: 'JetBrains Mono', monospace;
    opacity: 0.5;
    line-height: 1.6;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 8px;
  }

  .chip {
    padding: 7px 14px;
    border: 1px solid var(--border);
    border-radius: 20px;
    font-size: 12px;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.2s;
    background: var(--surface);
    font-family: 'JetBrains Mono', monospace;
  }

  .chip:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: rgba(124,111,247,0.08);
  }

  .msg-row {
    display: flex;
    gap: 12px;
    animation: fadeUp 0.3s ease forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .msg-row.user { flex-direction: row-reverse; }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .avatar.bot {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--accent);
  }

  .avatar.user { background: var(--user-bg); }

  .bubble {
    max-width: min(460px, 75vw);
    padding: 12px 16px;
    border-radius: 14px;
    font-size: 14px;
    line-height: 1.65;
  }

  .bubble.user {
    background: var(--user-bg);
    color: #fff;
    border-bottom-right-radius: 4px;
  }

  .bubble.bot {
    background: var(--bot-bg);
    color: var(--text);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px;
  }

  .bubble pre {
    background: rgba(0,0,0,0.4);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    overflow-x: auto;
    margin-top: 4px;
    color: #a8d8a8;
  }

  .timestamp {
    font-size: 10px;
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    margin-top: 4px;
    padding: 0 4px;
  }

  .msg-row.user .timestamp { text-align: right; }

  .typing {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 14px 16px;
    background: var(--bot-bg);
    border: 1px solid var(--border);
    border-radius: 14px;
    border-bottom-left-radius: 4px;
    width: fit-content;
  }

  .typing span {
    width: 6px;
    height: 6px;
    background: var(--accent);
    border-radius: 50%;
    animation: bounce 1.2s infinite;
  }

  .typing span:nth-child(2) { animation-delay: 0.2s; }
  .typing span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-6px); opacity: 1; }
  }

  .input-area {
    position: relative;
    z-index: 10;
    padding: 16px 20px;
    background: rgba(10,10,15,0.9);
    backdrop-filter: blur(20px);
    border-top: 1px solid var(--border);
  }

  .input-row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 10px 10px 10px 16px;
    transition: border-color 0.2s;
  }

  .input-row:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(124,111,247,0.1);
  }

  .input-field {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text);
    font-size: 14px;
    font-family: 'Syne', sans-serif;
    resize: none;
    min-height: 22px;
    max-height: 120px;
    line-height: 1.5;
  }

  .input-field::placeholder { color: var(--muted); }

  .send-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: var(--user-bg);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.2s;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(124,111,247,0.3);
  }

  .send-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(124,111,247,0.4);
  }

  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  .footer-hint {
    text-align: center;
    font-size: 10px;
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    margin-top: 8px;
    opacity: 0.5;
  }
`;

const SUGGESTIONS = [
  'tell me a joke 😄',
  'give me a quote',
  'list my github repos',
  'add a task: review PR',
];

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;

    setMessages(prev => [...prev, { role: 'user', content: msg, time: getTime() }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, time: getTime() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, an error occurred.', time: getTime() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content) => {
    try {
      const parsed = JSON.parse(content);
      return <pre>{JSON.stringify(parsed, null, 2)}</pre>;
    } catch {
      return <p style={{ whiteSpace: 'pre-wrap' }}>{content}</p>;
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="chat-root">
        <div className="bg-grid" />
        <div className="bg-glow" />

        <header className="header">
          <div className="header-icon">⚡</div>
          <div>
            <div className="header-title">MCP Nexus</div>
            <div className="header-sub">github · supabase · tasks · fun</div>
          </div>
          <div className="status-dot" />
        </header>

        <div className="messages">
          {messages.length === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <div className="empty-title">What can I help with?</div>
              <div className="empty-sub">
                Ask me to manage repos, query databases,<br />handle tasks, or just have some fun.
              </div>
              <div className="chips">
                {SUGGESTIONS.map(s => (
                  <button key={s} className="chip" onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              <div className={`msg-row ${msg.role === 'user' ? 'user' : 'bot'}`}>
                <div className={`avatar ${msg.role === 'user' ? 'user' : 'bot'}`}>
                  {msg.role === 'user' ? '👤' : '⚡'}
                </div>
                <div className={`bubble ${msg.role === 'user' ? 'user' : 'bot'}`}>
                  {formatMessage(msg.content)}
                </div>
              </div>
              <div className={`msg-row ${msg.role === 'user' ? 'user' : ''}`}>
                <div style={{ width: 32 }} />
                <div className="timestamp">{msg.time}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg-row bot">
              <div className="avatar bot">⚡</div>
              <div className="typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="input-area">
          <div className="input-row">
            <textarea
              className="input-field"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Message MCP Nexus..."
              disabled={loading}
              rows={1}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              ↑
            </button>
          </div>
          <div className="footer-hint">shift+enter for new line · enter to send</div>
        </div>
      </div>
    </>
  );
}

export default App;