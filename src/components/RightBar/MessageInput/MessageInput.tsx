import fileIcon from "@/assets/icons/right-bar/chat/file.svg";
import mediaIcon from "@/assets/icons/right-bar/chat/media.svg";
import sendIcon from "@/assets/icons/right-bar/chat/paperplane.svg";
import trashIcon from "@/assets/icons/right-bar/mediaViewer/trash.svg";
import { MessageInputProps } from "@interfaces/interfaces";
import appStore from "@store/app";
import { Logger } from "@utils/logger";
import { autorun } from "mobx";
import { useEffect, useRef, useState } from "preact/hooks";
import React from "react";
import * as style from "./MessageInput.module.scss";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
// const ALLOWED_TYPES = ["image/", "video/", "application/pdf"];
const ERROR_DISPLAY_TIME = 7000;

const MessageInput = ({}: MessageInputProps) => {
	const [message, setMessage] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const [filePreviews, setFilePreviews] = useState<Map<string, string>>(
		new Map(),
	);
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isErrorHiding, setIsErrorHiding] = useState(false);
	const errorTimeoutRef = useRef<number | null>(null);

	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const messageSound = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		messageSound.current = new Audio("/sounds/fchat_sfx.mp3");
		messageSound.current.volume = 0.5;
	}, []);

	const clearError = () => {
		if (errorTimeoutRef.current) {
			window.clearTimeout(errorTimeoutRef.current);
		}
		setIsErrorHiding(true);
		errorTimeoutRef.current = window.setTimeout(() => {
			setError(null);
			setIsErrorHiding(false);
		}, 300);
	};

	const showError = (message: string) => {
		if (errorTimeoutRef.current) {
			window.clearTimeout(errorTimeoutRef.current);
		}
		setIsErrorHiding(false);
		setError(message);
		errorTimeoutRef.current = window.setTimeout(clearError, ERROR_DISPLAY_TIME);
	};

	const generateFileId = (file: File) =>
		`${file.name}-${file.size}-${file.lastModified}`;

	const validateFile = (file: File): string | null => {
		// if (!ALLOWED_TYPES.some((type) => file.type.startsWith(type))) {
		// 	return `File ${file.name} is not a supported type`;
		// }
		if (file.size > MAX_FILE_SIZE) {
			return `File ${file.name} is too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`;
		}
		return null;
	};

	const handleSend = async () => {
		if (
			(!message.trim() && !files.length) ||
			isSending ||
			appStore.isSendingMessage
		)
			return;

		try {
			setIsSending(true);
			clearError();

			await appStore.sendMessage(message, files);

			setMessage("");
			setFiles([]);
			setFilePreviews(new Map());
			fileInputRef.current && (fileInputRef.current.value = "");

			messageSound.current?.play();
			textareaRef.current?.focus();
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to send message";
			showError(errorMessage);
			Logger.error(errorMessage);
		} finally {
			setIsSending(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			void handleSend();
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const input = e.target as HTMLInputElement;
		if (!input || !input.files) return;

		const newFiles = Array.from(input.files);
		const validFiles: File[] = [];
		const newPreviews = new Map(filePreviews);
		const errors: string[] = [];

		for (const file of newFiles) {
			const error = validateFile(file);
			if (error) {
				errors.push(error);
				continue;
			}

			if (files.length + validFiles.length >= MAX_FILES) {
				errors.push(`Cannot add more than ${MAX_FILES} files`);
				break;
			}

			validFiles.push(file);
			const fileId = generateFileId(file);
			if (file.type.startsWith("image/")) {
				try {
					const url = URL.createObjectURL(file);
					newPreviews.set(fileId, url);
				} catch (error) {
					Logger.error(`Failed to create preview for ${file.name}: ${error}`);
				}
			}
		}

		if (errors.length > 0) {
			showError(errors.join(", "));
		}

		setFiles((prevFiles) => [...prevFiles, ...validFiles]);
		setFilePreviews(newPreviews);
		setTimeout(() => {
			textareaRef.current?.focus();
		}, 0);
	};

	const handleSendMedia = () => {
		if (isSending || appStore.isSendingMessage) return;
		fileInputRef.current?.click();
	};

	const handleRemoveFile = (index: number, fileId: string) => {
		setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
		setFilePreviews((prevPreviews) => {
			const newPreviews = new Map(prevPreviews);
			const url = newPreviews.get(fileId);
			if (url) {
				URL.revokeObjectURL(url);
				newPreviews.delete(fileId);
			}
			return newPreviews;
		});
	};

	useEffect(() => {
		return () => {
			if (errorTimeoutRef.current) {
				window.clearTimeout(errorTimeoutRef.current);
			}
			filePreviews.forEach((url) => {
				URL.revokeObjectURL(url);
			});
		};
	}, []);

	useEffect(() => {
		if (textareaRef.current && containerRef.current) {
			const textarea = textareaRef.current;
			const container = containerRef.current;

			textarea.style.height = "auto";
			const maxHeight = 150;
			const minHeight = 40;
			const newHeight = Math.min(
				Math.max(textarea.scrollHeight, minHeight),
				maxHeight,
			);

			textarea.style.height = `${newHeight}px`;
			container.style.height = `${newHeight + 16}px`;
			textarea.style.overflowY =
				textarea.scrollHeight > maxHeight ? "scroll" : "hidden";
		}
	}, [message]);

	useEffect(() => {
		const focusTextarea = () => {
			if (textareaRef.current && !isSending) {
				textareaRef.current.focus();
			}
		};

		const dispose = autorun(() => {
			appStore.currentChannelId;
			setTimeout(focusTextarea, 0);
		});

		return () => {
			dispose();
		};
	}, [isSending]);

	return (
		<div className={style.messageInputContainer}>
			{error && (
				<div className={`${style.error} ${isErrorHiding ? style.hiding : ""}`}>
					{error}
				</div>
			)}
			{files.length > 0 && (
				<div className={style.filePreviewList}>
					{files.map((file, index) => {
						const fileId = generateFileId(file);
						return (
							<div key={fileId} className={style.filePreviewItem}>
								{file.type.startsWith("image/") && filePreviews.has(fileId) ? (
									<img
										src={filePreviews.get(fileId)}
										alt={file.name}
										className={style.filePreviewImage}
									/>
								) : (
									<img
										src={fileIcon}
										alt="File Icon"
										className={style.filePreviewIcon}
									/>
								)}
								<div className={style.fileNameContainer}>
									<span className={style.fileName}>{file.name}</span>
									<button
										onClick={() => handleRemoveFile(index, fileId)}
										className={style.removeFileButton}
										disabled={isSending || appStore.isSendingMessage}
									>
										<img
											src={trashIcon}
											alt="Remove"
											className={style.trashIcon}
										/>
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}
			<div className={style.messageInputBackground} ref={containerRef}>
				<button
					onClick={handleSendMedia}
					className={style.iconButton}
					disabled={isSending || appStore.isSendingMessage}
				>
					<img src={mediaIcon} alt="Media" className={style.icon} />
				</button>
				<textarea
					ref={textareaRef}
					value={message}
					onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
						const target = e.target as HTMLTextAreaElement;
						setMessage(target.value);
						clearError();
					}}
					placeholder="Write your message..."
					className={style.messageInput}
					onKeyDown={handleKeyDown}
					maxLength={5000}
					rows={1}
					disabled={isSending || appStore.isSendingMessage}
				/>
				<input
					type="file"
					multiple
					accept="image/*,video/*,application/pdf"
					onChange={handleFileChange}
					ref={fileInputRef}
					style={{ display: "none" }}
				/>
				<button
					onClick={() => void handleSend()}
					className={style.iconButton}
					disabled={
						isSending ||
						appStore.isSendingMessage ||
						(!message.trim() && !files.length)
					}
				>
					<img
						src={sendIcon}
						alt="Send"
						className={
							isSending ||
							appStore.isSendingMessage ||
							(!message.trim() && !files.length)
								? style.iconDisabled
								: style.icon
						}
					/>
				</button>
			</div>
		</div>
	);
};

export default MessageInput;
