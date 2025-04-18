import React from "react";
import { useEffect, useState } from "preact/hooks";
import { Button } from "@components/Base/Buttons/Button.tsx";
import { useEmailVerification } from "./EmailConfirmation.ts";

import styles from "./EmailConfirmationModal.module.css";
import TimerIcon from "@icons/timer.svg";

interface EmailConfirmationModalProps {
    isOpen: boolean;
    email: string;
    onClose: () => void;
    onVerify: (code: string) => Promise<void>;
    onResendCode: () => Promise<void>;
}

export const EmailConfirmationModal = ({
                                           isOpen,
                                           email,
                                           onClose,
                                           onVerify,
                                           onResendCode,
                                       }: EmailConfirmationModalProps) => {
    const {
        code,
        error,
        isResendDisabled,
        time,
        handleBackspace,
        handleVerify,
        handleResendCode,
        handlePaste,
        handleInputChange,
    } = useEmailVerification(onVerify, onResendCode);

    const [isErrorVisible, setIsErrorVisible] = useState(false);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        setIsErrorVisible(error);
    }, [error]);

    const closeModal = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        onClose();
    };

    return (
        <div className={`${styles["overlay"]} ${isOpen ? styles["visible"] : ""}`} onClick={closeModal}>
            <div className={styles["modal"]} onClick={(e) => { e.stopPropagation(); }}>
                <h2 className={styles["title"]}>Check your email</h2>
                <p className={styles["description"]}>{email ?? "Failed to receive mail"}</p>
                <div className={`${styles["code-input-container"]} ${error ? styles["error"] : ""}`}>
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            placeholder="0"
                            className={`${styles["code-input"]} ${styles["input-with-placeholder"]} ${error ? styles["error"] : ""}`}
                            value={digit}
                            maxLength={1}
                            onInput={(e) => { handleInputChange(e, index); }}
                            onPaste={handlePaste}
                            onKeyDown={(e) => { handleBackspace(e, index); }}
                        />
                    ))}
                </div>
                {isErrorVisible && (
                    <div className={`${styles["line"]} ${styles["error-line"]}`}>
                        Code is invalid
                    </div>
                )}
                <div className={styles["actions"]}>
                    <Button
                        onClick={() => handleVerify().catch(() => { setIsErrorVisible(true); })}
                        variant="primary"
                        width={318}
                        disabled={code.some((digit) => !digit)}
                    >
                        Confirm
                    </Button>
                    <div className={styles["resend-text"]}>
                        {isResendDisabled ? (
                            <>
                                <span>Time until you can resend code</span>
                                <div className={styles["timer-container"]}>
                                    <span className={styles["timer"]}>{formatTime(time)}</span>
                                    <img className={styles["timer-icon"]} src={TimerIcon} alt="Timer" />
                                </div>
                            </>
                        ) : (
                            <span>
                                Didn’t receive code?{" "}
                                <a onClick={() => handleResendCode().catch(() => { setIsErrorVisible(true); })}
                                   className={styles["resend-link"]}>
                                    Send again
                                </a>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};