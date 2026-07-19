import React, { useState, useRef, useEffect } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { SparklesIcon } from '../../icons/GenericIcons';
import { MicrophoneIcon } from '../../icons/AiIcons';
import { SIDEBAR_MODULES } from '../../../constants';

interface FileData {
    name: string;
    size: number;
}
interface Message {
    id: number;
    sender: 'user' | 'ai' | 'system';
    text?: string;
    suggestions?: string[];
    file?: FileData;
    timestamp: string;
    functionCall?: { name: string; args: Record<string, unknown> };
}
interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start: () => void;
    stop: () => void;
    onstart: () => void;
    onend: () => void;
    onerror: (event: { error: string }) => void;
    onresult: (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void;
}
declare global {
    interface Window {
        SpeechRecognition: { new (): SpeechRecognition };
        webkitSpeechRecognition: { new (): SpeechRecognition };
    }
}

interface AiAssistantProps {
    setActiveModule?: (module: string) => void;
}

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        ></path>
    </svg>
);
const PaperclipIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
        ></path>
    </svg>
);

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const parts = content.split(/(\n\|.*\|)/g).filter(Boolean);

    return (
        <div>
            {parts.map((part, index) => {
                if (part.trim().startsWith('\n|') && part.includes('|')) {
                    const lines = part.trim().split('\n');
                    const headers = lines[0]
                        .split('|')
                        .map((h) => h.trim())
                        .filter(Boolean);
                    const rows = lines.slice(2).map((line) =>
                        line
                            .split('|')
                            .map((cell) => cell.trim())
                            .filter(Boolean),
                    );

                    if (headers.length === 0 || rows.length === 0) {
                        return (
                            <p
                                key={index}
                                className="text-sm"
                                dangerouslySetInnerHTML={{
                                    __html: part
                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/\n/g, '<br />'),
                                }}
                            />
                        );
                    }

                    return (
                        <div
                            key={index}
                            className="overflow-x-auto my-2 bg-white/50 dark:bg-slate-800/50 rounded-lg"
                        >
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                    <tr>
                                        {headers.map((h, i) => (
                                            <th key={i} scope="col" className="px-4 py-2">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, i) => (
                                        <tr key={i} className="border-t dark:border-slate-700">
                                            {row.map((cell, j) => (
                                                <td key={j} className="px-4 py-2 whitespace-nowrap">
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }
                return (
                    <p
                        key={index}
                        className="text-sm"
                        dangerouslySetInnerHTML={{
                            __html: part
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n/g, '<br />'),
                        }}
                    />
                );
            })}
        </div>
    );
};

const AiAssistant: React.FC<AiAssistantProps> = ({ setActiveModule }) => {
    const { t, language } = useLocalization(['ai_automation', 'common']);
    const toast = useToast();

    const getInitialMessage = (): Message => ({
        id: Date.now(),
        sender: 'ai',
        text: t('ai_automation.assistant.initialGreeting'),
        suggestions: Object.values(
            t('ai_automation.assistant.initialSuggestions', { returnObjects: true }) || {},
        ) as string[],
        timestamp: new Date().toISOString(),
    });

    const [messages, setMessages] = useState<Message[]>([getInitialMessage()]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [micError, setMicError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [executedFunctionCalls, setExecutedFunctionCalls] = useState<Set<number>>(new Set());

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(scrollToBottom, [messages, isTyping]);

    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setMicError(t('ai_automation.assistant.micNotSupported'));
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setMicError(t('ai_automation.assistant.micPermissionDenied'));
            }
            setIsListening(false);
        };
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results as ArrayLike<{ 0: { transcript: string } }>)
                .map((result) => result[0])
                .map((result) => result.transcript)
                .join('');
            setInput(transcript);
        };

        recognitionRef.current = recognition;
    }, [t]);

    const handleListen = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            return;
        }
        setMicError(null);
        const langCode = ({ en: 'en-US', ar: 'ar-SA', tr: 'tr-TR' } as Record<string, string>)[
            language
        ];
        recognitionRef.current.lang = langCode ?? 'en-US';
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error('Speech recognition start error:', e);
        }
    };

    const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
        setMessages((prev) => [
            ...prev,
            { ...message, id: Date.now(), timestamp: new Date().toISOString() },
        ]);
    };

    const processUserMessage = async (
        text: string,
        file?: File,
    ): Promise<Omit<Message, 'id' | 'timestamp'>> => {
        // Static demo reply — ACTIVATE wires POST /ai/generate + tools.
        await new Promise((r) => setTimeout(r, 500));

        const lower = text.toLowerCase();
        const match = SIDEBAR_MODULES.find(
            (m) => lower.includes(m.key.replace(/_/g, ' ')) || lower.includes(m.key),
        );
        if (match && setActiveModule) {
            return {
                sender: 'ai',
                text:
                    language === 'ar'
                        ? `يمكنني فتح وحدة «${match.key}» لك.`
                        : `I can open the “${match.key}” module for you.`,
                functionCall: { name: 'navigate_to_module', args: { module_name: match.key } },
            };
        }

        const replyEn = file
            ? `Received “${file.name}”. File analysis is simulated in this demo.`
            : `Demo assistant reply for “${text}”. Ask about donors, projects, or how to complete a task.`;
        const replyAr = file
            ? `تم استلام «${file.name}». تحليل الملفات محاكى في هذا العرض التجريبي.`
            : `رد تجريبي على «${text}». اسأل عن المانحين أو المشاريع أو كيفية إنجاز مهمة.`;

        return {
            sender: 'ai',
            text: language === 'ar' ? replyAr : replyEn,
            suggestions:
                language === 'ar'
                    ? ['افتح المشاريع', 'ملخص المانحين', 'الانتقال للإعدادات']
                    : ['Open projects', 'Donor summary', 'Go to settings'],
        };
    };

    const handleExecuteFunction = (messageId: number, name: string, args: Record<string, unknown>) => {
        if (executedFunctionCalls.has(messageId)) return;

        if (name === 'navigate_to_module' && setActiveModule && typeof args.module_name === 'string') {
            setActiveModule(args.module_name);
            toast.showInfo(`Navigating to ${args.module_name}...`);
            addMessage({
                sender: 'system',
                text: `Action executed: Navigated to ${args.module_name}.`,
            });
        }

        setExecutedFunctionCalls((prev) => new Set(prev).add(messageId));
    };

    const handleSend = async (messageText?: string, file?: File) => {
        const textToSend = messageText || input;
        if (!textToSend.trim() && !file) return;
        addMessage({
            sender: 'user',
            text: textToSend,
            file: file ? { name: file.name, size: file.size } : undefined,
        });
        setInput('');
        setIsTyping(true);
        const aiResponse = await processUserMessage(textToSend, file);
        addMessage(aiResponse);
        setIsTyping(false);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleSend(t('ai_automation.assistant.uploadedFile', { fileName: file.name }), file);
            event.target.value = '';
        }
    };
    const handleNewConversation = () => {
        setMessages([getInitialMessage()]);
        setExecutedFunctionCalls(new Set());
    };

    const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => (
        <div
            className={`flex items-end gap-3 max-w-full ${msg.sender === 'user' ? 'justify-end' : ''}`}
        >
            {msg.sender === 'ai' && (
                <div className="w-8 h-8 flex-shrink-0 bg-primary-light dark:bg-primary/20 rounded-full flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-primary dark:text-secondary" />
                </div>
            )}
            <div
                className={`max-w-md lg:max-w-lg p-3 rounded-2xl ${
                    msg.sender === 'ai'
                        ? 'bg-gray-100 dark:bg-slate-700/50 rounded-es-none'
                        : msg.sender === 'user'
                          ? 'bg-primary text-white rounded-ee-none'
                          : 'w-full text-center bg-transparent'
                }`}
            >
                {msg.sender === 'system' ? (
                    <p className="text-xs italic text-gray-500 dark:text-gray-400">{msg.text}</p>
                ) : (
                    <>
                        {msg.file && (
                            <p className="text-sm italic mb-2">
                                📄{' '}
                                {t('ai_automation.assistant.uploadedFile', {
                                    fileName: msg.file.name,
                                })}
                            </p>
                        )}
                        {msg.text && <MarkdownRenderer content={msg.text} />}
                        {msg.functionCall && (
                            <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                                    {t('ai_automation.assistant.actionSuggested')}
                                </p>
                                <p className="font-mono text-xs my-2 p-2 bg-white/50 dark:bg-black/20 rounded">
                                    {msg.functionCall.name}(
                                    <span className="text-blue-600 dark:text-blue-400">
                                        {JSON.stringify(msg.functionCall.args)}
                                    </span>
                                    )
                                </p>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleExecuteFunction(
                                            msg.id,
                                            msg.functionCall!.name,
                                            msg.functionCall!.args,
                                        )
                                    }
                                    disabled={executedFunctionCalls.has(msg.id)}
                                    className="mt-2 w-full px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {executedFunctionCalls.has(msg.id)
                                        ? t('ai_automation.assistant.executed')
                                        : t('ai_automation.assistant.execute')}
                                </button>
                            </div>
                        )}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {msg.suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleSend(s)}
                                        className="text-xs px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 rounded-full border border-gray-300 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                        <p className="text-right text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {new Date(msg.timestamp).toLocaleTimeString(language, {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft border border-gray-200 dark:border-slate-700/50 h-[calc(100vh-16rem)] flex flex-col">
            <div className="flex-shrink-0 p-3 border-b dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-semibold">{t('ai_automation.assistant.title')}</p>
                </div>
                <button
                    type="button"
                    onClick={handleNewConversation}
                    className="text-xs px-2 py-1 border dark:border-slate-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                    {t('ai_automation.assistant.newConversation')}
                </button>
            </div>
            <div className="flex-grow p-4 overflow-y-auto">
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} msg={msg} />
                    ))}
                    {isTyping && (
                        <div className="flex items-end gap-3">
                            <div className="w-8 h-8 flex-shrink-0 bg-primary-light dark:bg-primary/20 rounded-full flex items-center justify-center">
                                <SparklesIcon className="w-5 h-5 text-primary dark:text-secondary" />
                            </div>
                            <div className="p-3 rounded-2xl bg-gray-100 dark:bg-slate-700/50 rounded-bl-none">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    {micError && (
                        <div className="text-center text-xs text-red-500 p-2">{micError}</div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 border-t dark:border-slate-700">
                <div className="relative">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <div className="absolute inset-y-0 start-0 flex items-center">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center w-12 text-gray-500 hover:text-primary"
                            title={t('ai_automation.assistant.attachFile')}
                        >
                            <PaperclipIcon className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={handleListen}
                            disabled={!!micError}
                            className={`flex items-center justify-center w-12 text-gray-500 hover:text-primary disabled:text-gray-300 disabled:cursor-not-allowed ${isListening ? 'text-red-500 animate-pulse' : ''}`}
                            title={t('ai_automation.assistant.micTooltip')}
                        >
                            <MicrophoneIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSend()}
                        placeholder={
                            isListening
                                ? t('ai_automation.assistant.listening')
                                : t('ai_automation.assistant.inputPlaceholder')
                        }
                        className="w-full p-3 ps-24 pe-12 text-sm border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-600 focus:ring-primary focus:border-primary"
                        disabled={isTyping}
                    />
                    <button
                        type="button"
                        onClick={() => handleSend()}
                        disabled={isTyping || !input.trim()}
                        className="absolute inset-y-0 end-0 flex items-center justify-center w-12 text-primary dark:text-secondary hover:bg-primary-light dark:hover:bg-primary/20 rounded-e-lg disabled:opacity-50"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiAssistant;
