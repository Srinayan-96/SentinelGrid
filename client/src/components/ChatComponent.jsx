import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useStore } from '../store';
import { Send, Cpu, User, MessageCircle } from 'lucide-react';
import socket from '../socket';

const ChatComponent = ({ incidentId, channel = 'GENERAL', title = 'Tactical Comms' }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const user = useStore(state => state.user);
  const token = useStore(state => state.token);
  const scrollRef = useRef();

  // Helper to accurately align sent messages to "You" across authenticated and anonymous civilian sessions
  const isMyMessage = (m) => {
    if (m.is_optimistic) return true;
    if (user?.id && String(m.sender_id) === String(user.id)) return true;
    // On the public citizen portal (no user session), messages sent under the CIVILIAN role belong to the active civilian
    if (!user && m.sender_role === 'CIVILIAN') return true;
    return false;
  };

  useEffect(() => {
    if (!incidentId) return;

    if (!socket.connected) {
      socket.connect();
    }

    const joinRoom = () => {
      socket.emit('JOIN_ROOM', incidentId);
      console.log('Joined room:', incidentId);
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.on('connect', joinRoom);
    }

    // Guarantee real-time chat freshness across browsers (like Opera) by combining WebSockets with robust 2-second background history polling
    const fetchHistory = () => {
      axios.get(`/api/messages/${incidentId}?channel=${channel}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setMessages(prev => {
          const fetched = res.data;
          // Preserve optimistic entries that haven't been confirmed in the server history yet
          const optimistics = prev.filter(m => m.is_optimistic);
          const merged = [...fetched];
          optimistics.forEach(opt => {
            if (!fetched.some(f => (f.content || f.text) === (opt.content || opt.text))) {
              merged.push(opt);
            }
          });
          return merged;
        });
      }).catch(err => console.error('History polling error:', err));
    };

    fetchHistory();
    const intervalId = setInterval(fetchHistory, 2000);

    const handleMessage = (msg) => {
      // Use loose String() comparisons to avoid ID matching drops when database vs state types differ
      const isMatch = String(msg.incident_id) === String(incidentId) || String(msg.incidentId) === String(incidentId);
      const isChannelMatch = !msg.channel || msg.channel === channel;
      if (isMatch && isChannelMatch) {
        setMessages(prev => {
          // If optimistic message with identical text exists, swap it with the server confirmed entity
          const optimisticIdx = prev.findIndex(m => m.is_optimistic && (m.content || m.text) === (msg.content || msg.text));
          if (optimisticIdx !== -1) {
            const updated = [...prev];
            updated[optimisticIdx] = msg;
            return updated;
          }
          // Prevent duplicates if a message with the same DB ID already exists
          if (msg.id && prev.some(m => m.id === msg.id)) {
            return prev;
          }
          return [...prev, msg];
        });
      }
    };

    socket.on('CHAT_MESSAGE', handleMessage);

    return () => {
      clearInterval(intervalId);
      socket.off('CHAT_MESSAGE', handleMessage);
      socket.off('connect', joinRoom);
    };
  }, [incidentId, channel, token]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const optimisticText = input;
    setInput('');

    // Append instantly optimistic for ultra low latency zero-delay feedback
    const optimisticMsg = {
      incident_id: incidentId,
      incidentId: incidentId,
      content: optimisticText,
      text: optimisticText,
      channel,
      sender_id: user?.id || 'civilian_session',
      sender_name: user?.name || 'Citizen',
      sender_role: user?.role || 'CIVILIAN',
      is_optimistic: true
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await axios.post('/api/messages', {
        incidentId,
        content: optimisticText,
        channel,
        sender_role: user?.role || 'CIVILIAN',
        sender_name: user?.name || 'Citizen'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Send failed', err);
    }
  };

  return (
    <div className="glass-panel" style={{ height: '300px', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageCircle size={16} color="#10b981"/>
        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#10b981' }}>{title}</span>
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((m, i) => {
          const isMine = isMyMessage(m);
          return (
            <div key={i} style={{
              alignSelf: isMine ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              background: m.is_ai ? 'rgba(16, 185, 129, 0.1)' : (isMine ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)'),
              padding: '0.8rem',
              borderRadius: '12px',
              border: m.is_ai ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.05)',
              fontSize: '0.8rem',
              opacity: m.is_optimistic ? 0.7 : 1
            }}>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {m.is_ai ? <Cpu size={10}/> : <User size={10}/>} {m.sender_name || (m.is_ai ? 'Tactical AI' : (isMine ? 'You' : m.sender_role || 'User'))}
              </div>
              {m.content || m.text}
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={onSend} style={{ display: 'flex', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', gap: '5px' }}>
        <input 
          className="input-base" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type transmission..." 
          style={{ marginTop: 0, padding: '0.5rem', fontSize: '0.8rem' }}
        />
        <button type="submit" style={{ background: '#10b981', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', color: 'white' }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatComponent;
