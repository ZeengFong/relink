import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import sendMsgIcon from '@/../icons/sendMsg.png';

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
    <div className="flex flex-col h-full">
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${
              msg.user_id === user.id ? 'justify-end' : ''
            }`}
          >
            {msg.user_id !== user.id && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://avatar.vercel.sh/${msg.user_id}.png`} />
                <AvatarFallback>{msg.user_id.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={`rounded-lg px-4 py-2 ${
                msg.user_id === user.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p className="text-xs text-muted-foreground/80">
                {new Date(msg.ts * 1000).toLocaleTimeString()}
              </p>
            </div>
            {msg.user_id === user.id && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://avatar.vercel.sh/${msg.user_id}.png`} />
                <AvatarFallback>{msg.user_id.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {!messages.length && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Be the first to wave 👋</p>
          </div>
        )}
      </div>
      <div className="p-4 border-t">
        <form onSubmit={sendMessage} className="grid grid-cols-[1fr,48px] items-center gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share an update"
            required
            className="h-12 w-full"
          />
          <button
            type="submit"
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary/90"
            aria-label="Send message"
          >
            <img src={sendMsgIcon} alt="" className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
