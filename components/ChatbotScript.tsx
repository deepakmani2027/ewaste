"use client"
import { useEffect, useRef } from "react";
import { usePathname } from 'next/navigation';
import "@/styles/chatbot.css";

// Fix for window.chtlConfig type
declare global {
	interface Window {
		chtlConfig?: { chatbotId: string };
	}
}

export default function ChatbotScript() {
	const mountedRef = useRef(false);
	const pathname = usePathname();

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const excluded = ['/', '/login', '/signup'];
		const scriptExists = document.getElementById('chtl-script');
		if (excluded.includes(pathname)) {
			// Remove visible widget elements if present
			document.getElementById('chtl-widget-frame')?.remove();
			document.getElementById('chtl-launcher')?.remove();
			return; // do not inject on excluded paths
		}

		if (mountedRef.current) return; // ensure single injection after leaving excluded pages

		const CHATBOT_ID = process.env.NEXT_PUBLIC_CHATBOT_ID || '2984257689';
		if (!document.querySelector('style[data-chatbot-inline]')) {
			const style = document.createElement('style');
			style.dataset.chatbotInline = 'true';
			style.textContent = `#chtl-widget-frame{right:24px!important;bottom:24px!important;position:fixed!important;z-index:2147483647!important}#chtl-launcher{right:32px!important;bottom:32px!important;position:fixed!important;z-index:2147483647!important}`;
			document.head.appendChild(style);
		}
		if (!scriptExists) {
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
	}, [pathname]);

	return null;
}
