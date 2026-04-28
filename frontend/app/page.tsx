"use client"
import React, { useState, useEffect, useRef } from 'react';

export default function MedicalDashboard() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "System Ready. Please upload a chest X-ray for AI diagnostic processing." }
  ]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Ref for auto-scrolling to the bottom of the chat
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const uploadAndScan = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/scan", { method: "POST", body: formData });
      const data = await res.json(); // Fixed: Added this line so 'data' exists
      
      const report = `Analysis Complete: **${data.disease_detected}** (${data.confidence_score}% confidence)`;
      setMessages(prev => [...prev, { role: 'ai', text: report }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "Upload failed. Is the Python server running?" }]);
    } finally {
      setLoading(false);
    }
  };

  const askAI = async () => {
    if (!userInput.trim()) return;

    const userMsg = { role: 'user', text: userInput };
    setMessages(prev => [...prev, userMsg]);
    setUserInput("");

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          patient_message: userInput, 
          scan_context: messages[messages.length - 1].text 
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "AI OFFLINE: Check backend connection." }]);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black text-slate-200 font-sans p-6 md:p-12">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            MEDVISION <span className="text-slate-500 font-light">PRO</span>
          </h1>
          <p className="text-slate-500 mt-2 uppercase tracking-widest text-xs font-bold">Advanced Neural Diagnostic Interface</p>
        </div>
        <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono animate-pulse">
          SYSTEM STATUS: ACTIVE
        </div>
      </div>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: SCANNER */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              Imaging Input
            </h2>
            <div className="aspect-[4/3] bg-black/40 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative">
              {loading && (
                <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-blue-400 font-mono text-sm uppercase">Neural Scan in Progress...</p>
                </div>
              )}
              <span className="text-slate-600 font-mono text-xs italic">Awaiting Dicom/JPEG Data...</span>
            </div>
            <label className="mt-6 block cursor-pointer">
              <input type="file" onChange={uploadAndScan} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 transition-all cursor-pointer"/>
            </label>
          </div>
        </div>

        {/* RIGHT: CHAT HUB */}
        <div className="lg:col-span-7 flex flex-col h-[600px] bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-800 bg-slate-800/30 text-sm font-bold tracking-tighter text-slate-400 uppercase">
            Consultation Log
          </div>
          
          <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none whitespace-pre-line'
                }`}>
                  {msg.text.split('**').map((part, index) => (
                    index % 2 === 1 ? <b key={index} className="text-blue-300 font-bold">{part}</b> : part
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-slate-950/50 border-t border-slate-800">
            <div className="flex gap-3">
              <input 
                value={userInput} 
                onChange={(e) => setUserInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                placeholder="Ask follow-up questions..."
                onKeyDown={(e) => e.key === 'Enter' && askAI()}
              />
              <button onClick={askAI} className="bg-slate-100 hover:bg-white text-black px-6 py-3 rounded-xl font-bold transition-transform active:scale-95">
                SEND
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 text-center text-slate-600 text-[10px] uppercase tracking-[0.3em]">
        Experimental Diagnostic AI // v2.0.4
      </footer>
    </div>
  );
}