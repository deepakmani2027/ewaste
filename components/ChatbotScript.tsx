"use client"
import { useEffect, useRef } from "react";
import "@/styles/chatbot.css";

// Fix for window.chtlConfig type
declare global {
	interface Window {
		chtlConfig?: { chatbotId: string };
	}
}

export default function ChatbotScript() {
	const mountedRef = useRef(false);

	useEffect(() => {
		if (mountedRef.current) return; // ensure single injection
		if (typeof window === 'undefined') return;

		const CHATBOT_ID = process.env.NEXT_PUBLIC_CHATBOT_ID || '2984257689';
		// Fallback inline style in case global stylesheet not yet applied
		if (!document.querySelector('style[data-chatbot-inline]')) {
			const style = document.createElement('style');
			style.dataset.chatbotInline = 'true';
			style.textContent = `#chtl-widget-frame{right:24px!important;bottom:24px!important;position:fixed!important;z-index:2147483647!important}#chtl-launcher{right:32px!important;bottom:32px!important;position:fixed!important;z-index:2147483647!important}`;
			document.head.appendChild(style);
		}
		if (!document.getElementById('chtl-script')) {
			window.chtlConfig = { chatbotId: CHATBOT_ID };
			const script = document.createElement('script');
			script.async = true;
			script.id = 'chtl-script';
			script.type = 'text/javascript';
			script.setAttribute('data-id', CHATBOT_ID);
			script.src = 'https://chatling.ai/js/embed.js';
			document.body.appendChild(script);
		}
		mountedRef.current = true;
	}, []);

	return null;
}
