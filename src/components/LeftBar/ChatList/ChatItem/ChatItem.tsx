import { useState, useEffect, useMemo } from "react";
import styles from "./ChatItem.module.css";
<<<<<<< HEAD
import { replaceEmojis } from "@utils/emoji.ts";
import { observer } from "mobx-react";
import { ChannelType } from "@foxogram/api-types";
import { ChatItemProps } from "@interfaces/interfaces.ts";
=======
import { replaceEmojis } from "@utils/emoji";
import { observer } from "mobx-react";
import { ChannelType } from "@foxogram/api-types";
import { ChatItemProps } from "@interfaces/interfaces";
>>>>>>> eec53638717d97f0b9ec2a017f2129589cdcd0e9

const ChatItem = observer(({ chat, onSelectChat, currentUser, isActive }: ChatItemProps) => {
    const [emojiReplacedName, setEmojiReplacedName] = useState<string>("");

    const lastMessageContent = useMemo(() => {
        const lastMessage = chat.lastMessage;
        const authorName = lastMessage?.author.user.username ?? "Unknown user";
        const isCurrentUserAuthor = lastMessage?.author.id === currentUser;

        return lastMessage
            ? isCurrentUserAuthor
                ? `You: ${lastMessage.content}`
                : `${authorName}: ${lastMessage.content}`
            : "No messages";
    }, [chat.lastMessage, currentUser]);

    useEffect(() => {
        const replaceNameEmojis = async () => {
            const replacedName = await replaceEmojis(chat.display_name || chat.name, "64");
            setEmojiReplacedName(replacedName);
        };

        void replaceNameEmojis();
    }, [chat.display_name, chat.name]);

    const chatItemClass = chat.type === ChannelType.DM ? styles["news-channel"] : "";

    const avatarContent = useMemo(() => {
        if (chat.icon) {
            return (
                <img
                    src={chat.icon}
                    alt={chat.display_name || chat.name}
                    className={styles["chat-avatar"]}
                />
            );
        }
        return (
            <div className={styles["default-avatar"]}>
                {(chat.display_name || chat.name).charAt(0).toUpperCase()}
            </div>
        );
    }, [chat.icon, chat.display_name, chat.name]);

    return (
        <div
            className={`${styles["chat-item"]} ${chatItemClass} ${isActive ? styles["active-chat"] : ""}`}
            onClick={() => { onSelectChat(chat); }}
        >
            {avatarContent}
            <div className={styles["chat-info"]}>
                <p className={styles["chat-name"]}>
                    {emojiReplacedName}
                </p>
                <p className={styles["chat-message"]}>
                    {lastMessageContent}
                </p>
            </div>
        </div>
    );
});

export default ChatItem;
