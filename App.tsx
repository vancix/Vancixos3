import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { VancixState, LogEntry, Contact } from './types';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from './utils/audioUtils';
import { tools, SYSTEM_INSTRUCTION } from './constants';
import HologramRing from './components/HologramRing';

// --- MOCK DATA ---
const MOCK_CONTACTS: Contact[] = [
  { name: 'Boss', phone: '+255700000001' },
  { name: 'Mom', phone: '+255700000002' },
  { name: 'John Dev', phone: '+255700000003' },
];

const App: React.FC = () => {
  const [state, setState] = useState<VancixState>(VancixState.IDLE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [audioVolume, setAudioVolume] = useState(0);
  const [location, setLocation] = useState<string>('Unknown');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false);
  const [groundingUrls, setGroundingUrls] = useState<Array<{title: string, uri: string}>>([]);
  const [schedule, setSchedule] = useState<Array<{time: string, event: string}>>([
    { time: '10:00 AM', event: 'System Diagnostics' }
  ]);

  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`);
        },
        () => setLocation('Location Access Denied')
      );
    }
  }, []);

  const addLog = (type: LogEntry['type'], text: string) => {
    setLogs(prev => [{ type, text, timestamp: new Date() }, ...prev].slice(0, 50));
  };

  const handleToolCall = async (functionCalls: any[], session: any) => {
    const responses = [];
    
    for (const fc of functionCalls) {
      addLog('system', `Executing: ${fc.name}`);
      let result: any = { status: "ok" };

      try {
        if (fc.name === 'openUrl') {
          window.open(fc.args.url, '_blank');
          result = { result: `Opened ${fc.args.url}` };
        } 
        else if (fc.name === 'makeCall') {
          window.open(`tel:${fc.args.number}`);
          result = { result: `Calling ${fc.args.number}` };
        } 
        else if (fc.name === 'sendMessage') {
          window.open(`sms:${fc.args.number}?body=${encodeURIComponent(fc.args.message)}`);
          result = { result: `Message draft opened for ${fc.args.number}` };
        }
        else if (fc.name === 'getDeviceTime') {
            result = { dateTime: new Date().toString() };
        }
        else if (fc.name === 'getContacts') {
            result = { contacts: MOCK_CONTACTS };
        }
        else if (fc.name === 'manageSchedule') {
            if (fc.args.action === 'add') {
                const newEvent = { time: fc.args.time || 'TBD', event: fc.args.event || 'Unknown Event' };
                setSchedule(prev => [...prev, newEvent]);
                result = { result: `Added ${newEvent.event} at ${newEvent.time} to schedule.` };
            } else {
                result = { schedule: schedule };
            }
        }
      } catch (e: any) {
        console.error(e);
        result = { error: e.message };
      }

      responses.push({
        id: fc.id,
        name: fc.name,
        response: result
      });
    }

    session.sendToolResponse({ functionResponses: responses });
  };

  const startSession = async () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      alert("API Key not configured.");
      return;
    }

    try {
      setHasStarted(true);
      setState(VancixState.LISTENING);
      
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: tools,
        },
        callbacks: {
          onopen: () => {
            addLog('system', 'Vancix OS Online. Systems Nominal.');
            
            // Process Microphone Input
            const ctx = inputAudioContextRef.current!;
            const source = ctx.createMediaStreamSource(stream);
            const processor = ctx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Calculate volume for visualizer
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              setAudioVolume(Math.sqrt(sum / inputData.length) * 5); // Scale up a bit

              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(ctx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const { serverContent, toolCall } = msg;

            if (toolCall) {
               setState(VancixState.THINKING);
               // Ensure functionCalls is defined before passing
               if (toolCall.functionCalls) {
                   sessionPromise.then(session => handleToolCall(toolCall.functionCalls!, session));
               }
            }

            if (serverContent) {
              if (serverContent.modelTurn?.parts?.[0]?.inlineData?.data) {
                 setState(VancixState.SPEAKING);
                 const audioData = serverContent.modelTurn.parts[0].inlineData.data;
                 
                 const ctx = outputAudioContextRef.current!;
                 nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                 
                 const audioBuffer = await decodeAudioData(
                   base64ToUint8Array(audioData),
                   ctx
                 );

                 const source = ctx.createBufferSource();
                 source.buffer = audioBuffer;
                 const gainNode = ctx.createGain();
                 gainNode.gain.value = 1.0;
                 source.connect(gainNode);
                 gainNode.connect(ctx.destination);
                 
                 source.onended = () => {
                     sourcesRef.current.delete(source);
                     if (sourcesRef.current.size === 0) {
                        setState(VancixState.LISTENING);
                     }
                 };

                 source.start(nextStartTimeRef.current);
                 nextStartTimeRef.current += audioBuffer.duration;
                 sourcesRef.current.add(source);
              }

              // Handle Grounding (Search Results)
              const chunks = serverContent.groundingMetadata?.groundingChunks;
              if (chunks && chunks.length > 0) {
                 const newUrls = chunks
                    .filter((c: any) => c.web?.uri)
                    .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
                 setGroundingUrls(prev => [...newUrls, ...prev].slice(0, 5));
              }
            }
          },
          onclose: () => {
             addLog('system', 'Connection Closed');
             setState(VancixState.IDLE);
             setHasStarted(false);
          },
          onerror: (err) => {
             console.error(err);
             addLog('system', 'Error: ' + err.toString());
             setState(VancixState.ERROR);
          }
        }
      });
      sessionPromiseRef.current = sessionPromise;

    } catch (error) {
      console.error(error);
      addLog('system', 'Initialization Failed');
      setState(VancixState.ERROR);
    }
  };

  const stopSession = () => {
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-black text-cyan-400 flex flex-col relative overflow-hidden selection:bg-cyan-900 selection:text-white">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-6 border-b border-cyan-900/50 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#0ff]"></div>
            <h1 className="text-3xl font-bold tracking-widest font-[Orbitron]">VANCIX OS</h1>
        </div>
        <div className="text-right">
            <p className="text-xl font-mono">{currentTime}</p>
            <p className="text-xs text-cyan-600 uppercase tracking-widest">{location}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row p-6 gap-6">
        
        {/* Left Panel: Logs & Context */}
        <div className="w-full md:w-1/4 flex flex-col gap-4">
           {/* System Status Box */}
           <div className="hologram-box p-4 rounded-lg h-1/3">
             <h2 className="text-sm font-bold uppercase tracking-widest mb-2 border-b border-cyan-800 pb-1">System Status</h2>
             <div className="space-y-2 text-sm font-mono opacity-80">
                <div className="flex justify-between"><span>CPU</span><span>NOMINAL</span></div>
                <div className="flex justify-between"><span>NETWORK</span><span>CONNECTED</span></div>
                <div className="flex justify-between"><span>LOC</span><span>{location.substring(0,10)}...</span></div>
                <div className="flex justify-between"><span>USER</span><span>VANCIX</span></div>
             </div>
           </div>

           {/* Schedule Box */}
           <div className="hologram-box p-4 rounded-lg flex-1 overflow-hidden flex flex-col">
              <h2 className="text-sm font-bold uppercase tracking-widest mb-2 border-b border-cyan-800 pb-1">Daily Schedule</h2>
              <div className="overflow-y-auto flex-1 space-y-2">
                  {schedule.map((s, i) => (
                      <div key={i} className="flex justify-between items-center bg-cyan-900/20 p-2 rounded hover:bg-cyan-900/40 cursor-pointer transition">
                          <span className="font-bold text-sm">{s.event}</span>
                          <span className="text-xs opacity-60 font-mono">{s.time}</span>
                      </div>
                  ))}
                  {schedule.length === 0 && <p className="text-xs opacity-40 italic">No scheduled events.</p>}
              </div>
           </div>
        </div>

        {/* Center: Hologram Interface */}
        <div className="w-full md:w-2/4 flex flex-col items-center justify-center">
            <div className="mb-12">
                <HologramRing state={state} volume={audioVolume} />
            </div>

            {!hasStarted ? (
                 <button 
                 onClick={startSession}
                 className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-md border border-cyan-500 hover:bg-cyan-900/30 transition-all duration-300"
               >
                 <div className="absolute inset-0 w-0 bg-cyan-500 transition-all duration-[250ms] ease-out group-hover:w-full opacity-10"></div>
                 <span className="relative text-xl font-bold tracking-[0.2em] font-[Orbitron]">INITIALIZE VANCIX</span>
               </button>
            ) : (
                <button 
                onClick={stopSession}
                className="mt-8 text-red-500 hover:text-red-400 text-sm tracking-widest uppercase border border-red-900/50 px-4 py-2 rounded hover:bg-red-900/20 transition"
              >
                Terminate Session
              </button>
            )}
        </div>

        {/* Right Panel: Data & Links */}
        <div className="w-full md:w-1/4 flex flex-col gap-4">
             {/* Command Log */}
             <div className="hologram-box p-4 rounded-lg h-1/2 flex flex-col">
                <h2 className="text-sm font-bold uppercase tracking-widest mb-2 border-b border-cyan-800 pb-1">Command Log</h2>
                <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono">
                    {logs.map((log, idx) => (
                        <div key={idx} className={`p-1 border-l-2 pl-2 ${
                            log.type === 'system' ? 'border-yellow-500 text-yellow-200' :
                            log.type === 'agent' ? 'border-cyan-500 text-cyan-100' : 
                            'border-green-500 text-green-200'
                        }`}>
                            <span className="opacity-50">[{log.timestamp.toLocaleTimeString()}]</span> {log.text}
                        </div>
                    ))}
                </div>
             </div>

             {/* Web Search Results (Grounding) */}
             <div className="hologram-box p-4 rounded-lg h-1/2 flex flex-col">
                <h2 className="text-sm font-bold uppercase tracking-widest mb-2 border-b border-cyan-800 pb-1">Intel Feed</h2>
                <div className="flex-1 overflow-y-auto space-y-3">
                    {groundingUrls.length === 0 && <p className="text-xs opacity-40 italic">Waiting for search data...</p>}
                    {groundingUrls.map((url, i) => (
                        <a key={i} href={url.uri} target="_blank" rel="noreferrer" className="block p-2 bg-cyan-950/30 hover:bg-cyan-900/50 rounded border border-cyan-900/50 transition">
                            <p className="text-sm font-bold truncate text-cyan-300">{url.title}</p>
                            <p className="text-[10px] truncate opacity-50">{url.uri}</p>
                        </a>
                    ))}
                </div>
             </div>
        </div>

      </main>

      <footer className="relative z-10 p-4 text-center text-[10px] text-cyan-800 uppercase tracking-[0.5em] border-t border-cyan-900/30">
        Vancix OS v1.0.4 // Authorized Personnel Only
      </footer>
    </div>
  );
};

export default App;