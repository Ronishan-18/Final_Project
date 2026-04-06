'use client';
import { useState, useEffect, useRef } from 'react';
import { Send, Clock } from 'lucide-react';
import { getChatHistory } from '@/lib/friends';
import { useSocket } from '@/contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';
import styles from '../app/chat/[friendId]/chat.module.scss';

interface ChatWindowProps {
  friendId: number;
  onBack?: () => void;
}

export default function ChatWindow({ friendId, onBack }: ChatWindowProps) {
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [friend, setFriend] = useState<any>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<number | null>(null);
  const myId = useRef<number>(0);

  useEffect(() => {
    const stored = localStorage.getItem('userId');
    if (stored) myId.current = parseInt(stored);
    else {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.id) {
            myId.current = user.id;
            localStorage.setItem('userId', user.id.toString());
          }
        } catch {}
      }
    }

    return () => {
      if (typingTimeout.current !== null) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!friendId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [history, friendRes] = await Promise.all([
          getChatHistory(friendId),
          api.get(`/profile/${friendId}`),
        ]);
        setMessages(history);
        setFriend(friendRes.data.user);
        socket?.emit('mark_read', { sender_id: friendId });
      } catch (err) {
        console.error('Failed to load chat:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [friendId, socket]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !friendId) return;

    const handleNewMessage = (msg: any) => {
      if (msg.sender_id === friendId || msg.receiver_id === friendId) {
        setMessages(prev => [...prev, msg]);
        socket.emit('mark_read', { sender_id: friendId });
      }
    };

    const handleMessageSent = (msg: any) => {
      if (msg.receiver_id === friendId) {
        setMessages(prev => [...prev, msg]);
      }
    };

    const handleTyping = ({ user_id, is_typing }: any) => {
      if (user_id === friendId) setIsTyping(is_typing);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('user_typing', handleTyping);
    };
  }, [socket, friendId]);

  useEffect(() => {
    if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || !socket) return;
    socket.emit('send_message', { 
      receiver_id: friendId, 
      content: input.trim() 
    });
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    socket?.emit('typing', { receiver_id: friendId, is_typing: true });
    if (typingTimeout.current !== null) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = window.setTimeout(() => {
      socket?.emit('typing', { receiver_id: friendId, is_typing: false });
      typingTimeout.current = null;
    }, 1500);
  };

  const isOnline = onlineUsers[friendId];

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (date: string) => {
    if (!date) return 'Last seen recently';
    try {
      return `Last seen ${formatDistanceToNow(new Date(date), { addSuffix: true })}`;
    } catch {
      return 'Offline';
    }
  };

  if (loading) return <div className={styles.loading}>Initializing Secure Chat...</div>;

  return (
    <div className={styles.chatContainer} style={{ border: 'none', maxWidth: '100%' }}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          <img 
            src={friend?.avatar ? `http://localhost:5000${friend.avatar}` : '/default-avatar.png'} 
            alt="" 
            className={styles.avatar} 
          />
          <span className={`${styles.statusDot} ${isOnline ? styles.online : styles.offline}`} />
        </div>
        <div className={styles.friendInfo}>
          <p className={styles.friendName}>{friend?.full_name || friend?.username}</p>
          <p className={`${styles.friendStatus} ${isOnline ? styles.onlineText : ''}`}>
            {isOnline ? (
              'Online Now'
            ) : (
              <span className={styles.lastSeen}>
                 {formatLastSeen(friend?.last_seen)}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages} ref={messagesContainerRef}>
        {messages.length === 0 && (
          <div className={styles.noMessages}>
            <p>Secure connection established. Say hello to {friend?.username}!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === myId.current;
          const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString();
          
          return (
            <div key={msg.id || i}>
              {showDate && (
                <div className={styles.dateDivider}>
                  <span>{new Date(msg.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>
              )}
              <div className={`${styles.msgRow} ${isMine ? styles.mine : styles.theirs}`}>
                {!isMine && (
                  <img 
                    src={msg.sender_avatar ? `http://localhost:5000${msg.sender_avatar}` : '/default-avatar.png'} 
                    className={styles.msgAvatar} 
                    alt="" 
                  />
                )}
                <div className={`${styles.bubble} ${isMine ? styles.myBubble : styles.theirBubble}`}>
                  <p>{msg.content}</p>
                  <span className={styles.time}>{formatTime(msg.created_at)}</span>
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className={`${styles.msgRow} ${styles.theirs}`}>
            <img 
              src={friend?.avatar ? `http://localhost:5000${friend.avatar}` : '/default-avatar.png'} 
              className={styles.msgAvatar} 
              alt="" 
            />
            <div className={`${styles.bubble} ${styles.theirBubble} ${styles.typingBubble}`}>
              <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrp}>
          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={`Message ${friend?.username}...`}
            className={styles.input}
            maxLength={1000}
          />
        </div>
        <button 
          className={styles.sendBtn} 
          onClick={handleSend} 
          disabled={!input.trim()}
          title="Send"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
