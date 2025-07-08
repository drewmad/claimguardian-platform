/**
 * @fileMetadata
 * @purpose AI chat panel for interacting with Guardian AI, supporting text and image input.
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/gemini-api", "@/lib/constants"]
 * @exports ["AiChatPanel"]
 * @complexity high
 * @tags ["component", "ai", "chat", "modal"]
 * @status active
 */
import React, { useState, useEffect, useRef } from 'react';
import { X, Bot, ArrowRight, Paperclip, XCircle } from 'lucide-react';
import Image from 'next/image';
import callGeminiAPI from '@/lib/gemini-api';

interface Message {
  from: 'user' | 'ai';
  text: string;
  imagePreviewUrl?: string;
}

const AiChatPanel = ({ onClose, isMobile, context }) => {
    const [messages, setMessages] = useState<Message[]>([
        { from: 'ai', text: "Hello! I'm Guardian AI. I'm currently in demo mode, providing sample responses. To enable real AI analysis, add your Gemini API key. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attachedImage, setAttachedImage] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result;
                if (typeof result === 'string') {
                    const base64String = result.split(',')[1];
                    setAttachedImage({
                        data: base64String,
                        mimeType: file.type,
                        name: file.name,
                        previewUrl: URL.createObjectURL(file)
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async () => {
        if ((!input.trim() && !attachedImage) || isLoading) return;

        const userMessageText = input || (attachedImage ? `Analyze this image: ${attachedImage.name}` : '');
        const userMessage: Message = { 
            from: 'user', 
            text: userMessageText,
            imagePreviewUrl: attachedImage?.previewUrl
        };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        
        const imageToSend = attachedImage;
        setAttachedImage(null);
        setIsLoading(true);

        const chatHistory = newMessages.slice(0, -1).map(msg => ({
            role: msg.from === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));
        
        let prompt = input;
        if (context && context.type === 'claim_assessment') {
            prompt = `In the context of a claim for "${context.data.incidentType}" at "${context.data.location}", the user asked: "${input}"`;
        }

        const aiResponseText = await callGeminiAPI(prompt, chatHistory, null, imageToSend);
        
        setMessages(prev => [...prev, { from: 'ai', text: aiResponseText }]);
        setIsLoading(false);
    };
    
    const panelClass = isMobile
        ? "fixed inset-0 bg-bgSecondary z-50 flex flex-col"
        : "fixed bottom-24 right-6 w-full max-w-md h-[60vh] bg-bgSecondary rounded-lg shadow-xl z-50 flex flex-col";

    return (
        <div className={panelClass}>
            <header className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
                <h3 className="font-slab text-lg font-bold flex items-center gap-2"><Bot className="neon-lime-text"/> Ask Guardian</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-bgTertiary"><X size={20}/></button>
            </header>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex items-end gap-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.from === 'ai' && <div className="w-8 h-8 rounded-full accent-blue-bg flex items-center justify-center flex-shrink-0"><Bot size={20} className="text-white"/></div>}
                        <div className={`max-w-xs md:max-w-sm p-3 rounded-lg ${msg.from === 'user' ? 'accent-blue-bg text-white' : 'bg-bgTertiary'}`}>
                            {msg.imagePreviewUrl && <Image src={msg.imagePreviewUrl} alt="User upload" width={160} height={90} className="rounded-md mb-2"/>}
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full accent-blue-bg flex items-center justify-center flex-shrink-0"><Bot size={20} className="text-white"/></div>
                        <div className="max-w-xs md:max-w-sm p-3 rounded-lg bg-bgTertiary">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-textSecondary rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-textSecondary rounded-full animate-bounce [animation-delay:0.075s]"></span>
                                <span className="w-2 h-2 bg-textSecondary rounded-full animate-bounce [animation-delay:0.15s]"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <footer className="p-3 border-t border-border flex-shrink-0 bg-bgSecondary">
                {attachedImage && (
                    <div className="p-2 bg-bgTertiary rounded-lg mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Image src={attachedImage.previewUrl} alt="preview" width={40} height={40} className="rounded object-cover" />
                            <span className="text-sm text-textSecondary truncate">{attachedImage.name}</span>
                        </div>
                        <button onClick={() => setAttachedImage(null)} className="p-1 text-textSecondary hover:text-white"><XCircle size={18}/></button>
                    </div>
                )}
                <div className="relative flex items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current.click()} className="p-3 rounded-lg bg-bgTertiary hover:bg-border">
                        <Paperclip size={20}/>
                    </button>
                    <input 
                        type="text" 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder="Type or attach an image..." 
                        className="flex-grow bg-bgTertiary rounded-lg p-3 pr-12 border border-transparent focus:border-accent outline-none" 
                        disabled={isLoading}
                    />
                    <button 
                        onClick={handleSend}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full accent-blue-bg text-white hover:opacity-90 disabled:opacity-50" 
                        disabled={isLoading || (!input.trim() && !attachedImage)}
                    >
                        <ArrowRight size={20}/>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default AiChatPanel;
