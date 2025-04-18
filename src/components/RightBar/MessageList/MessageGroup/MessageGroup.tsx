<<<<<<< HEAD
import MessageItem from "@components/RightBar/MessageList/MessageGroup/MessageItem/MessageItem.tsx";
import styles from "./MessageGroup.module.css";
import { MessageGroupProps } from "@interfaces/interfaces.ts";
import { chatStore } from "@store/chat/chatStore.ts";
=======
import MessageItem from "@components/RightBar/MessageList/MessageGroup/MessageItem/MessageItem";
import styles from "./MessageGroup.module.css";
import { MessageGroupProps } from "@interfaces/interfaces";
import { chatStore } from "@store/chatStore";
>>>>>>> eec53638717d97f0b9ec2a017f2129589cdcd0e9

const MessageGroup = ({ messages, currentUserId }: MessageGroupProps) => {
    if (messages.length === 0) return null;

    const firstMessage = messages[0];
    if (!firstMessage) return null;

    return (
        <div className={`${styles["message-group"]}`}>
            {messages.map((msg) => (
                <MessageItem
                    key={msg.id}
                    content={msg.content}
                    created_at={msg.created_at}
                    author={msg.author}
                    currentUserId={currentUserId}
                    showAuthorName={true}
                    attachments={msg.attachments ?? []}
                    status={msg.status}
                    onRetry={() => chatStore.retryMessage(msg.id)}
                    onDelete={() => chatStore.deleteMessage(msg.id)}
                />
            ))}
        </div>
    );
};

<<<<<<< HEAD
export default MessageGroup;
=======
export default MessageGroup;
>>>>>>> eec53638717d97f0b9ec2a017f2129589cdcd0e9
