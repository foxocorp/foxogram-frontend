import styles from "./EmptyState.module.css";
<<<<<<< HEAD
import { EmptyStateProps, Channel } from "@interfaces/interfaces.ts";
=======
import { EmptyStateProps, Channel } from "@interfaces/interfaces";
>>>>>>> eec53638717d97f0b9ec2a017f2129589cdcd0e9


const EmptyState = ({ chats, onSelectChat, selectedChat }: EmptyStateProps) => {
    const handleChatClick = (chat: Channel) => {
        onSelectChat(chat);
    };

    const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp);

        const is12HourFormat = new Intl.DateTimeFormat("en-US", { hour12: true }).formatToParts(new Date()).some(part => part.type === "dayPeriod");

        const options: Intl.DateTimeFormatOptions = {
            hour: "2-digit",
            minute: "2-digit",
            hour12: is12HourFormat,
        };

        const formatter = new Intl.DateTimeFormat("en-US", options);
        return formatter.format(date);
    };

    return (
        <div className={styles["empty-container"]}>
            <div className={styles["content"]}>
                <h1 className={styles["empty-header"]}>
                    Select a channel to start messaging
                </h1>
                <p className={styles["empty-subtext"]}>or check unread messages:</p>
                <div className={styles["chat-list"]}>
                    {chats.map((chat, index) => (
                        <div
                            key={index}
                            className={`${styles["chat-item"]} ${
                                selectedChat?.name === chat.name ? styles["selected"] : ""
                            }`}
                            onClick={() => { handleChatClick(chat); }}
                        >
                            <div className={styles["avatar"]}>
                                {chat.icon ? (
                                    <img
                                        src={chat.icon}
                                        alt={chat.name}
                                        className={styles["chat-avatar"]}
                                    />
                                ) : (
                                    <div className={styles["default-avatar"]}>
                                        {chat.display_name.charAt(0).toUpperCase() ||
                                            chat.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className={styles["chat-content"]}>
                                <span className={styles["username"]}>
                                    {chat.display_name || chat.name}
                                </span>
                                <span className={styles["message-preview"]}>
                                    {chat.lastMessage?.content && chat.lastMessage.content.length > 20
                                        ? `${chat.lastMessage.content.substring(0, 20)}...`
                                        : chat.lastMessage?.content}</span>
                            </div>
                            <span className={styles["timestamp"]}>
                                {chat.lastMessage
                                    ? formatTimestamp(chat.lastMessage.created_at)
                                    : "00:00"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles["glow"]} />
        </div>
    );
};

export default EmptyState;
