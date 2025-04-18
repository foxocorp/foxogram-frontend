import { useState, useEffect, useRef } from "preact/hooks";
import styles from "./MessageInput.module.css";
import mediaIcon from "@icons/chat/media.svg";
import sendIcon from "@icons/chat/paperplane.svg";
<<<<<<< HEAD
import { MessageInputProps } from "@interfaces/interfaces.ts";
import { chatStore } from "@store/chat/chatStore.ts";
import { Logger } from "@utils/logger.ts";
=======
import { MessageInputProps } from "@interfaces/interfaces";
import { chatStore } from "@store/chatStore";
import { Logger } from "@utils/logger";
>>>>>>> eec53638717d97f0b9ec2a017f2129589cdcd0e9
import React from "react";

const MessageInput = ({ }: MessageInputProps) => {
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const handleSend = async () => {
        if ((!message.trim() && !files.length) || chatStore.isSendingMessage) return;

        try {
            setMessage("");
            setFiles([]);
            await chatStore.sendMessage(message, files);
        } catch (error) {
            Logger.error(error instanceof Error ? error.message : "An unknown error occurred");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            void handleSend();
            e.preventDefault();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target as HTMLInputElement;
        if (input.files) {
            setFiles(Array.from(input.files));
        }
    };

    const handleSendMedia = () => {
        if (fileInputRef) {
            fileInputRef.click();
        }
    };

    useEffect(() => {
        if (textareaRef.current && containerRef.current) {
            const textarea = textareaRef.current;
            const container = containerRef.current;
            textarea.style.height = "auto";
            const maxHeight = 150;
            const minHeight = 40;
            const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
            textarea.style.height = `${newHeight}px`;
            container.style.height = `${newHeight + 16}px`;
            textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "scroll" : "hidden";
        }
    }, [message]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    return (
        <div className={styles["message-input-container"]}>
            <div className={styles["message-input-background"]} ref={containerRef}>
                <button onClick={handleSendMedia} className={styles["icon-button"]}>
                    <img src={mediaIcon} alt="Media" className={styles["icon"]} />
                </button>
                <textarea
                    ref={textareaRef}
                    value={message}
                    onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        setMessage((e.target as HTMLTextAreaElement).value);
                    }}
                    placeholder="Write your message..."
                    className={styles["message-input"]}
                    onKeyDown={handleKeyDown}
                    rows={1}
                />
                <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className={styles["file-input"]}
                    ref={(input) => { setFileInputRef(input); }}
                    style={{ display: "none" }}
                />
                <button onClick={() => { void handleSend(); }} className={styles["icon-button"]}>
                    <img src={sendIcon} alt="Send" className={styles["icon"]} />
                </button>
            </div>
        </div>
    );
};

<<<<<<< HEAD
export default MessageInput;
=======
export default MessageInput;
>>>>>>> eec53638717d97f0b9ec2a017f2129589cdcd0e9
