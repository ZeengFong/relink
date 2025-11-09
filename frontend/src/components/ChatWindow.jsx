import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('/chat', {
  autoConnect: false,
  withCredentials: true,
});

export default function ChatWindow({ chatId, api, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (!chatId) {
      return;
    }
    api(`/chats/${chatId}/messages`).then(({ messages: existing }) => setMessages(existing));
  }, [chatId, api]);

  useEffect(() => {
    if (!chatId) {
      return undefined;
    }
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('join_room', { chat_id: chatId });

    const handleMessage = ({ chat_id, message }) => {
      if (chat_id === chatId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('message', handleMessage);
    return () => {
      socket.off('message', handleMessage);
    };
  }, [chatId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (evt) => {
    evt.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('message', { chat_id: chatId, text: trimmed });
    setText('');
  };

  return (
    <section className="chat-window" aria-live="polite">
      <div ref={listRef} className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`bubble ${msg.user_id === user.id ? 'self' : 'other'}`}>
            <small style={{ display: 'block', opacity: 0.7, marginBottom: '0.25rem' }}>{msg.user_id}</small>
            <p style={{ margin: 0 }}>{msg.text}</p>
            <small>{new Date(msg.ts * 1000).toLocaleTimeString()}</small>
          </div>
        ))}
        {!messages.length && <p className="empty-state">No messages yet. Be the first to wave 👋</p>}
      </div>
      <form className="chat-input" onSubmit={sendMessage} aria-label="Send message">
        <label htmlFor="chat-text" className="visually-hidden">
          Message text
        </label>
        <input
          id="chat-text"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share an update"
          required
        />
        <button type="submit">Send</button>
      </form>
    </section>
  );
}
