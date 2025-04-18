import ReactMarkdown from "react-markdown";
import { useEffect, useMemo, useState } from "preact/hooks";
import styles from "./MessageItem.module.css";
import { MessageItemProps, Attachment } from "@interfaces/interfaces";
import StateSending from "@icons/chat/state-sending.svg";
import StateSent from "@icons/chat/state-sent.svg";
import StateFailed from "@icons/chat/state-failed.svg";
import EditIcon from "@icons/chat/edit-message.svg";
import ReplyIcon from "@icons/chat/reply.svg";
import ForwardIcon from "@icons/chat/forward.svg";
import TrashIcon from "@icons/chat/trash.svg";
import FileIcon from "@icons/chat/file.svg";

const FALLBACK_USER = {
    id: -1,
    username: "Unknown",
    display_name: "Unknown User",
    avatar: "",
    type: "user",
    created_at: Date.now(),
    email: "",
    flags: 0,
};

const FALLBACK_MEMBER = {
    id: -1,
    user: FALLBACK_USER,
    channel: {
        id: -1,
        name: "Unknown Channel",
        display_name: "Unknown Channel",
        icon: "",
        type: "text",
        member_count: 0,
        owner: FALLBACK_USER,
        created_at: Date.now(),
    },
    permissions: 0,
    joined_at: Date.now(),
};

const MessageItem = ({
                         content,
                         created_at,
                         author,
                         currentUserId,
                         showAuthorName = true,
                         attachments = [],
                         status = "sent",
                         onDelete,
                         onEdit,
                         onReply,
                         onForward,
                         previousAuthorId,
                     }: MessageItemProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isShiftPressed, setIsShiftPressed] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Shift") setIsShiftPressed(true);
        };
        const handleKeyUp = () => { setIsShiftPressed(false); };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    const statusIcon = useMemo(() => {
        switch (status) {
            case "sending":
                return StateSending;
            case "failed":
                return StateFailed;
            default:
                return StateSent;
        }
    }, [status]);

    const safeAuthor = useMemo(() => author || FALLBACK_MEMBER, [author]);

    const isMessageAuthor = useMemo(
        () => safeAuthor.user.id === currentUserId,
        [safeAuthor, currentUserId],
    );

    const formattedTime = useMemo(
        () => new Date(created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        }),
        [created_at],
    );

    const validAttachments = useMemo(() =>
            (attachments as Attachment[])
                .filter(att =>
                    att.content_type.startsWith("image/") ||
                    att.content_type === "video/mp4" ||
                    att.content_type === "audio/mpeg",
                )
                .map(att => ({
                    url: `https://cdn.foxogram.su/attachments/${att.id}.${att.content_type.split("/")[1]}`,
                    filename: att.filename,
                    contentType: att.content_type,
                })),
        [attachments],
    );

    const shouldShowAuthorName = useMemo(
        () => showAuthorName && previousAuthorId !== safeAuthor.user.id,
        [showAuthorName, previousAuthorId, safeAuthor.user.id],
    );

    return (
        <div
            className={`${styles["message-item"]} ${
                isMessageAuthor ? styles["author"] : styles["receiver"]
            }`}
            onMouseEnter={() => { setIsHovered(true); }}
            onMouseLeave={() => { setIsHovered(false); }}
        >
            <div className={styles["avatar-container"]}>
                {safeAuthor.user.avatar ? (
                    <img
                        src={safeAuthor.user.avatar}
                        className={styles["avatar"]}
                        alt="User avatar"
                    />
                ) : (
                    <div className={styles["default-avatar"]}>
                        {safeAuthor.user.display_name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            <div className={styles["message-bubble"]}>
                {validAttachments.length > 0 && (
                    <div className={styles["attachments-grid"]}>
                        {validAttachments.map((attachment, index) => {
                            const [mainType, subType] = attachment.contentType.split("/");

                            return (
                                <div key={index} className={styles["attachment-container"]}>
                                    {mainType === "image" ? (
                                        <img
                                            src={attachment.url}
                                            className={subType === "gif"
                                                ? styles["gif-attachment"]
                                                : styles["image-attachment"]}
                                            alt={attachment.filename}
                                        />
                                    ) : mainType === "video" ? (
                                        <video controls className={styles["video-attachment"]}>
                                            <source src={attachment.url} type={attachment.contentType} />
                                        </video>
                                    ) : mainType === "audio" ? (
                                        <audio controls className={styles["audio-attachment"]}>
                                            <source src={attachment.url} type={attachment.contentType} />
                                        </audio>
                                    ) : (
                                        <a
                                            href={attachment.url}
                                            download={attachment.filename}
                                            className={styles["file-attachment"]}
                                        >
                                            <FileIcon className={styles["file-icon"]} />
                                            <span>{attachment.filename}</span>
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {(content || validAttachments.length > 0) && (
                    <div className={styles["text-content"]}>
                        {shouldShowAuthorName && !isMessageAuthor && (
                            <div className={styles["author-name"]}>
                                {safeAuthor.user.display_name}
                            </div>
                        )}

                        {content && (
                            <div className={styles["message-text"]}>
                                <ReactMarkdown>{content}</ReactMarkdown>
                            </div>
                        )}

                        <div className={styles["message-footer"]}>
                            <span className={styles["timestamp"]}>{formattedTime}</span>
                            {isMessageAuthor && (
                                <img
                                    src={statusIcon}
                                    className={styles["status-icon"]}
                                    alt="Message status"
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {isHovered && isShiftPressed && (
                <div className={styles["action-popup"]}>
                    {isMessageAuthor && (
                        <button
                            onClick={onEdit}
                            aria-label="Edit message"
                        >
                            <img
                                src={EditIcon}
                                alt="Edit"
                                width={24}
                                height={24}
                            />
                        </button>
                    )}
                    <button
                        onClick={onReply}
                        aria-label="Reply to message">
                        <img
                            src={ReplyIcon}
                            alt="Reply"
                            width={24}
                            height={24}
                        />
                    </button>
                    <button
                        onClick={onForward}
                        aria-label="Forward message">
                        <img
                            src={ForwardIcon}
                            alt="Forward"
                            width={24}
                            height={24}
                        />
                    </button>
                    {isMessageAuthor && (
                        <button
                            onClick={onDelete}
                            aria-label="Delete message">
                            <img
                                src={TrashIcon}
                                alt="Delete"
                                width={24}
                                height={24}
                            />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessageItem;