import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import client from '../api/client';

interface Message {
  id: string;
  sender_name: string;
  sender_role: string;
  text: string;
  created_at: string;
}

const ChatPanel: React.FC<{ incidentId: string, socket: any }> = ({ incidentId, socket }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const { user } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load history
    client.get(`/messages/${incidentId}`).then(res => setMessages(res.data));

    if (socket) {
      socket.on('chat:message', (msg: Message) => {
        setMessages(prev => [...prev, msg]);
      });
    }

    return () => {
      if (socket) socket.off('chat:message');
    };
  }, [incidentId, socket]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    const msg = {
      incidentId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text
    };

    socket?.emit('chat:message', msg);
    setText('');
  };

  return (
    <div className="flex flex-col h-[500px] bg-[#0B0F1A] border border-slate-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-[#161C2C] flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Live Comms</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-slate-400">Connected</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex flex-col ${m.sender_name === user?.name ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
              m.sender_name === user?.name 
                ? 'bg-cyan-900/50 text-cyan-50 border border-cyan-800/50 rounded-br-none' 
                : 'bg-slate-800/50 text-slate-100 border border-slate-700/50 rounded-bl-none'
            }`}>
              <div className="text-[9px] font-bold uppercase mb-1 opacity-50 flex items-center gap-1">
                <UserIcon className="w-2 h-2" /> {m.sender_name} • {m.sender_role}
              </div>
              {m.text}
            </div>
            <span className="text-[8px] text-slate-500 mt-1">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-[#161C2C] flex gap-2">
        <input 
          type="text" 
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type emergency update..."
          className="flex-1 bg-[#0B0F1A] border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-cyan-500 outline-none"
        />
        <button type="submit" className="bg-cyan-600 p-2 rounded-lg hover:bg-cyan-500">
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
