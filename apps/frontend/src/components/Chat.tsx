import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import styles from './Chat.module.css';

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

interface ChatProps {
  roomId: string;
  onSendMessage: (message: string) => void;
  socket: any;
}

const Chat: React.FC<ChatProps> = ({
  roomId,
  onSendMessage,
  socket,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const localPlayerId = sessionStorage.getItem('playerId') || '';
  const [inputMessage, setInputMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat-message', (data: { playerId: string; message: string; timestamp: number }) => {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        playerId: data.playerId,
        playerName: data.playerId === localPlayerId ? 'You' : 'Opponent',
        message: data.message,
        timestamp: data.timestamp
      };
      setMessages(prev => [...prev, newMessage]);
    });

    return () => {
      socket.off('chat-message');
    };
  }, [socket, localPlayerId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={clsx(styles.chat, {
      [styles.minimized]: isMinimized,
    })}>
      <div className={styles.chatHeader}>
        <span className={styles.chatTitle}>Chat</span>
        <button
          className={styles.minimizeButton}
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? '▲' : '▼'}
        </button>
      </div>

      {!isMinimized && (
        <>
          <div className={styles.messages}>
            {(messages || []).map((msg) => (
              <div
                key={msg.id}
                className={clsx(styles.message, {
                  [styles.ownMessage]: msg.playerId === localPlayerId,
                  [styles.systemMessage]: msg.isSystem,
                })}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.playerName}>
                    {msg.isSystem ? 'System' : msg.playerName}
                  </span>
                  <span className={styles.timestamp}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div className={styles.messageContent}>
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              className={styles.input}
              maxLength={200}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!inputMessage.trim()}
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Chat;