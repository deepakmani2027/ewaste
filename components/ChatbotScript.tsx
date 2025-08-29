"use client"
import { useAuth } from "@/components/auth/auth-context";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import "@/styles/chatbot.css";

// Fix for window.chtlConfig type
declare global {
	interface Window {
		chtlConfig?: { chatbotId: string };
	}
}

export default function ChatbotScript() {
	const { isAuthenticated, loading } = useAuth();
	const pathname = usePathname();

	useEffect(() => {
		// Only inject script if authenticated and not on login page
		if (typeof window !== "undefined" && isAuthenticated && !loading && pathname !== "/login") {
			if (!document.getElementById("chtl-script")) {
				window.chtlConfig = { chatbotId: "2984257689" };
				const script = document.createElement("script");
				script.async = true;
				script.setAttribute("data-id", "2984257689");
				script.id = "chtl-script";
				script.type = "text/javascript";
				script.src = "https://chatling.ai/js/embed.js";
				document.body.appendChild(script);
			}
		} else {
			// Remove script if not authenticated or on login page
			const existing = document.getElementById("chtl-script");
			if (existing) existing.remove();
		}
	}, [isAuthenticated, loading, pathname]);

	return null;
}
