<<<<<<< HEAD
import MessageGroup from "@components/RightBar/MessageList/MessageGroup/MessageGroup.tsx";
import styles from "./MessageList.module.css";
import { Message, MessageListProps } from "@interfaces/interfaces.ts";
=======
import MessageGroup from "@components/RightBar/MessageList/MessageGroup/MessageGroup";
import styles from "./MessageList.module.css";
import { Message, MessageListProps } from "@interfaces/interfaces";
>>>>>>> eec53638717d97f0b9ec2a017f2129589cdcd0e9
import { useEffect, useMemo, useRef } from "preact/hooks";
import moment from "moment";

const MessageList = ({ messages, currentUserId, messageListRef, onScroll, channel }: MessageListProps) => {
    const prevMessagesCount = useRef(messages.length);
    const isInitialLoad = useRef(true);

    useEffect(() => {
        isInitialLoad.current = true;
    }, [channel.id]);

    const groupedMessages = useMemo(() => {
        if (!messages?.length) return [];

        const groups = [];
        let currentGroup: Message[] = [];
        let currentAuthor = -1;
        let currentDate = "";

        for (const msg of messages) {
            if (!msg?.created_at || !msg.author?.user?.id) continue;

            const msgDate = moment(msg.created_at).format("YYYY-MM-DD");
            const lastMessage = currentGroup[currentGroup.length-1];

            const timeDiff = lastMessage?.created_at
                ? msg.created_at - lastMessage.created_at
                : Infinity;

            if (msgDate !== currentDate ||
                msg.author.user.id !== currentAuthor ||
                timeDiff > 300000) {

                if (currentGroup.length) {
                    groups.push(createGroup(currentGroup, currentDate));
                }
                currentGroup = [msg];
                currentAuthor = msg.author.user.id;
                currentDate = msgDate;
            } else {
                currentGroup.push(msg);
            }
        }

        if (currentGroup.length) groups.push(createGroup(currentGroup, currentDate));
        return groups;
    }, [messages]);

    useEffect(() => {
        const list = messageListRef.current;
        if (!list || !messages.length) return;

        if (isInitialLoad.current) {
            list.scrollTop = list.scrollHeight;
            isInitialLoad.current = false;
        } else if (messages.length > prevMessagesCount.current) {
            const wasNearBottom = list.scrollHeight - list.scrollTop <= list.clientHeight + 200;
            if (wasNearBottom) {
                list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
            }
        }
        prevMessagesCount.current = messages.length;
    }, [messages.length]);

    return (
        <div className={styles["message-list"]} ref={messageListRef} onScroll={onScroll}>
            {groupedMessages.map((group, index) => (
                <div key={`${group.dateLabel}-${group.messages[0]?.id ?? `group-${index}`}`}>
                    {group.dateLabel && (
                        <div className={styles["sticky-date"]}>
                            <span>{group.dateLabel}</span>
                        </div>
                    )}
                    <MessageGroup
                        messages={group.messages}
                        currentUserId={currentUserId}
                    />
                </div>
            ))}
        </div>
    );
};

function createGroup(messages: Message[], date: string) {
    const isToday = date === moment().format("YYYY-MM-DD");
    return {
        dateLabel: isToday ? null : moment(date).format("MMMM D, YYYY"),
        messages: messages.filter(msg =>
            msg?.created_at &&
            msg.author?.user?.id
        )
    };
}

<<<<<<< HEAD
export default MessageList;
=======
export default MessageList;
>>>>>>> eec53638717d97f0b9ec2a017f2129589cdcd0e9
