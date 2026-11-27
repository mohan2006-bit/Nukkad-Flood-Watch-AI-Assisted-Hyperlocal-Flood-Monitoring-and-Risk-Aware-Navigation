import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  CheckCheck, 
  Bot, 
  MapPin, 
  ShieldCheck, 
  Droplets, 
  Sparkles, 
  ArrowRight,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile
} from 'lucide-react';
import { useFlood } from '../context/FloodContext';
import { parseWhatsAppFloodMessage } from '../utils/floodLogic';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  parsedData?: ReturnType<typeof parseWhatsAppFloodMessage>;
  isRecorded?: boolean;
}

export const WhatsAppSimulator: React.FC<{ onNavigateToMap: () => void }> = ({ onNavigateToMap }) => {
  const { addReport, language, t } = useFlood();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_welcome',
      sender: 'bot',
      text: language === 'ta' 
        ? 'வணக்கம்! நான் உங்கள் நுக்கட் வெள்ளக் கண்காணிப்பு வாட்ஸ்அப் உதவியாளர். உங்கள் தெருவின் வெள்ள அளவை தமிழ் அல்லது ஆங்கிலத்தில் தட்டச்சு செய்யவும் அல்லது கீழே உள்ள மாதிரி கேள்விகளை அழுத்தவும்.'
        : 'Vanakkam! I am your Nukkad Flood Watch WhatsApp assistant. Type your street water level in English or தமிழ், or tap one of the quick prompts below.',
      timestamp: '10:42 AM'
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    {
      label: 'Knee deep at Vijayanagar, Velachery',
      text: 'Water is knee deep near Vijayanagar bus stand in Velachery, two wheelers struggling'
    },
    {
      label: 'மடிப்பாக்கம் இடுப்பளவு நீர் (Tamil)',
      text: 'மடிப்பாக்கம் குபேரன் நகர் இடுப்பளவு தண்ணீர் தேங்கி நிற்கிறது, மின்வெட்டு உள்ளது'
    },
    {
      label: 'Query: Is Velachery Bypass open?',
      text: 'Is Velachery 100ft bypass road clear for cars right now?'
    },
    {
      label: 'Chest deep water in Mudichur',
      text: 'Water reached chest level in Mudichur Krishna Nagar, 2 elderly people stranded needing rescue'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: timeString
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInputText('');
    setIsTyping(true);

    // Simulate realistic AI parsing and response
    setTimeout(() => {
      const parsed = parseWhatsAppFloodMessage(textToSend);
      
      let botReply = '';
      if (textToSend.toLowerCase().includes('clear') || textToSend.toLowerCase().includes('open') || textToSend.toLowerCase().includes('passable')) {
        botReply = language === 'ta'
          ? `தகவல் சரிபார்க்கப்பட்டது: வேளச்சேரி உயர்மட்ட மேம்பாலம் முற்றிலும் சீரானது. தரைத்தள சந்திப்பில் 18-24 அங்குல நீர் உள்ளதால் மேம்பாலத்தைப் பயன்படுத்தவும்.`
          : `Traffic telemetry update: Velachery High-Level Flyover is completely clear. Ground-level bypass has 18" water—use the elevated flyover.`;
      } else {
        botReply = language === 'ta'
          ? `அறிக்கை பெறப்பட்டது! பகுதி: ${parsed.neighborhoodName}, இடம்: ${parsed.streetName}, நீர் அளவு: ${parsed.waterDepthInches}" (${parsed.depthCategory}). வரைபடத்தில் சேர்க்க கீழே உள்ள பொத்தானை அழுத்தவும்.`
          : `Got it! Detected flood report for ${parsed.streetName} (${parsed.neighborhoodName}) with ${parsed.waterDepthInches}" water depth (${parsed.depthCategory}). Tap below to confirm and broadcast to the live street map:`;
      }

      const botMessage: Message = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        parsedData: parsed
      };

      setIsTyping(false);
      setMessages(prev => [...prev, botMessage]);
    }, 700);
  };

  const handleRecordToMap = (messageId: string, parsedData: NonNullable<Message['parsedData']>) => {
    const report = addReport({
      neighborhoodId: parsedData.neighborhoodId || 'velachery',
      streetName: parsedData.streetName || 'Main Road',
      waterDepthInches: parsedData.waterDepthInches || 14,
      depthCategory: parsedData.depthCategory || 'knee',
      flowSpeed: parsedData.flowSpeed || 'slow',
      passability: parsedData.waterDepthInches && parsedData.waterDepthInches > 20 ? 'boat_only' : 'four_wheeler_only',
      powerOutage: Boolean(parsedData.powerOutage),
      strandedVulnerableCount: parsedData.strandedCount || 0,
      reporterName: 'WhatsApp Citizen',
      reporterRole: 'resident',
      notes: `Reported via Nukkad WhatsApp Bot: ${parsedData.waterDepthInches}" water reported near ${parsedData.streetName}`,
      source: 'whatsapp'
    });

    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return {
          ...m,
          isRecorded: true,
          text: m.text + `\n\n✅ Report #${report.id.slice(-6)} recorded to live street map!`
        };
      }
      return m;
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Introduction banner */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white">{t.botTitle}</h4>
            <p className="text-slate-400 text-[11px]">
              NLP parsing extracts depth, location and conditions into shared live state
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
          WhatsApp Simulator
        </span>
      </div>

      {/* Explicit Simulator Disclaimer Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-300 flex items-start gap-2.5">
        <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 shrink-0">
          DEMO SIMULATOR
        </span>
        <p className="text-[11px] leading-relaxed">
          <strong>WhatsApp Simulator Only:</strong> This is a local interactive demo component simulating WhatsApp citizen intake. It is <em>not</em> connected to Meta/WhatsApp servers or official emergency lines.
        </p>
      </div>

      {/* WhatsApp Simulated Phone Frame */}
      <div className="bg-slate-950 rounded-3xl border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[580px] max-h-[82vh]">
        {/* WhatsApp Top Header Bar */}
        <div className="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between shadow-md select-none shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 border border-emerald-400 flex items-center justify-center font-bold text-white shadow">
                <Bot className="w-6 h-6" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-emerald-800"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm tracking-tight">Nukkad Flood Bot (Simulator)</h3>
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center text-[9px] font-extrabold">✓</span>
              </div>
              <p className="text-[11px] text-emerald-100 opacity-90">{t.botOnline}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-emerald-100">
            <Phone className="w-4 h-4 opacity-70" />
            <Video className="w-4 h-4 opacity-70" />
            <MoreVertical className="w-4 h-4 opacity-70" />
          </div>
        </div>

        {/* WhatsApp Chat Message Area */}
        <div 
          className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-[#0b141a] text-xs scrollbar-thin min-h-0"
          style={{
            backgroundImage: `radial-gradient(#1e293b 0.75px, transparent 0.75px)`,
            backgroundSize: '16px 16px'
          }}
        >
          {messages.map(msg => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-md relative ${
                    isUser
                      ? 'bg-[#005c4b] text-white rounded-tr-none'
                      : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/40'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed text-[12px]">{msg.text}</p>

                  {/* If Bot message has parsed data, render interactive confirmation card */}
                  {msg.parsedData && !msg.isRecorded && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-400">Extracted Intelligence:</span>
                        <span className="text-slate-400">Confidence: {Math.round(msg.parsedData.confidence * 100)}%</span>
                      </div>
                      <div className="text-[11px] text-slate-300 space-y-0.5">
                        <div>Location: <strong className="text-white">{msg.parsedData.streetName}</strong></div>
                        <div>Area: <strong className="text-white">{msg.parsedData.neighborhoodName}</strong></div>
                        <div>Depth: <strong className="text-amber-400">{msg.parsedData.waterDepthInches}" ({msg.parsedData.depthCategory})</strong></div>
                        {msg.parsedData.powerOutage && <div className="text-amber-400">⚠️ Power cut reported</div>}
                        {msg.parsedData.strandedCount ? <div className="text-red-400 font-bold">🚨 Stranded rescue needed!</div> : null}
                      </div>

                      <button
                        onClick={() => handleRecordToMap(msg.id, msg.parsedData!)}
                        className="w-full mt-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t.botAddToMap}</span>
                      </button>
                    </div>
                  )}

                  {/* Timestamp & read ticks */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {isUser && <CheckCheck className="w-3 h-3 text-cyan-400" />}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-1.5 bg-[#202c33] text-slate-400 px-3 py-2 rounded-xl w-24 text-[11px] animate-pulse">
              <span>typing</span>
              <span className="animate-bounce">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Chips: Wrapped layout prevents horizontal overflow blowout */}
        <div className="bg-[#111b21] border-t border-slate-800 p-2 shrink-0">
          <div className="text-[10px] text-slate-400 mb-1 px-1 font-semibold flex items-center justify-between">
            <span>{t.quickPromptsTitle}</span>
            <span className="text-slate-500 text-[9px]">Tap to test bot response</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p.text)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 transition-all text-left truncate max-w-full"
                title={p.text}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Input Field Bar: Always visible and shrink-0 */}
        <div className="bg-[#202c33] p-2 sm:p-2.5 flex items-center gap-2 border-t border-slate-800 shrink-0 sticky bottom-0 z-10">
          <button type="button" aria-label="Add emoji" className="text-slate-400 hover:text-slate-200 p-1">
            <Smile className="w-5 h-5" />
          </button>
          <button type="button" aria-label="Attach file" className="text-slate-400 hover:text-slate-200 p-1">
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            type="text"
            aria-label="Chat input message"
            placeholder={t.botPlaceholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-[#2a3942] text-slate-100 placeholder-slate-400 text-xs rounded-xl px-3 py-2.5 focus:outline-none min-w-0"
          />

          <button
            type="button"
            aria-label="Send message"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
