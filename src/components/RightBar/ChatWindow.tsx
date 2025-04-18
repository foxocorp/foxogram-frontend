import { useRef, useEffect } from "preact/hooks";
import { observer } from "mobx-react";
import MessageList from "./MessageList/MessageList.tsx";
import MessageInput from "./MessageInput/MessageInput.tsx";
import ChatHeader from "./ChatHeader/ChatHeader.tsx";
import styles from "./ChatWindow.module.css";
import { chatStore } from "@store/chat/chatStore.ts";
import { ChatWindowProps } from "@interfaces/interfaces.ts";
import { useThrottle } from "@hooks/useThrottle.ts";

interface Props extends ChatWindowProps {
    isMobile: boolean;
    onBack?: () => void;
}

const ChatWindow = observer(({ channel, isMobile, onBack }: Props) => {
    const messageListRef = useRef<HTMLDivElement>(null);
    const messages = chatStore.messagesByChannelId[channel.id] || [];
    const scrollState = useRef({
        prevHeight: 0,
        lastLoadPosition: 0,
        isTracking: false,
    });

    useEffect(() => {
        document.title = channel.display_name || channel.name || "Foxogram";
    }, [channel]);

    const handleScroll = useThrottle(() => {
        const list = messageListRef.current;
        if (!list || chatStore.isLoadingHistory || !messages.length) return;
        const scrollPosition = list.scrollTop;
        const triggerZone = list.clientHeight * 0.7;
        if (scrollPosition < triggerZone && !scrollState.current.isTracking) {
            scrollState.current.prevHeight = list.scrollHeight;
            scrollState.current.lastLoadPosition = scrollPosition;
            scrollState.current.isTracking = true;
            const beforeTimestamp = messages[0]?.created_at ?? undefined;
            chatStore.fetchMessages(channel.id, beforeTimestamp).finally(() => {
                scrollState.current.isTracking = false;
            });
        }
    }, 300);

    return (
        <div className={styles["chat-window"]}>
            <ChatHeader
                avatar={channel.icon}
                username={channel.name}
                displayName={channel.display_name}
                channelId={channel.id}
                isMobile={isMobile}
                onBack={isMobile ? (onBack as () => void) : () => {}}
            />
            <MessageList
                messages={messages}
                currentUserId={chatStore.currentUserId ?? -1}
                messageListRef={messageListRef}
                onScroll={handleScroll}
                channel={channel}
            />
            <MessageInput
                onSendMessage={(content, files) => chatStore.sendMessage(content, files)}
                isSending={chatStore.isSendingMessage}
            />
        </div>
    );
});

export default ChatWindow;