import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";

export function useLoadingMessages(intervalMs = 3500) {
    const { t } = useLanguage();
    const messages = t.loadingMessages || ["Loading..."];
    
    const [currentMessage, setCurrentMessage] = useState(messages[Math.floor(Math.random() * messages.length)]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentMessage((prevMessage: string) => {
                let newMessage;
                do {
                    newMessage = messages[Math.floor(Math.random() * messages.length)];
                } while (newMessage === prevMessage && messages.length > 1);
                return newMessage;
            });
        }, intervalMs);

        return () => clearInterval(intervalId);
    }, [messages, intervalMs]);

    return currentMessage;
}
