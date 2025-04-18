import { Button } from "@components/Base/Buttons/Button.tsx";
import { usePasswordReset } from "./PasswordReset";
import styles from "./PasswordResetModal.module.css";
import TimerIcon from "@icons/timer.svg";
import { APIOk } from "@foxogram/api-types";

interface PasswordResetModalProps {
    isOpen: boolean;
    email: string;
    onClose: () => void;
    onSendEmail: (email: string) => Promise<APIOk>;
    onVerifyCode: (code: string) => Promise<APIOk>;
    onResetPassword: (password: string) => Promise<APIOk | undefined>;
    onResendCode: () => Promise<APIOk>;
}

export const PasswordResetModal = ({
                                       isOpen,
                                       email,
                                       onClose,
                                       onSendEmail,
                                       onVerifyCode,
                                       onResetPassword,
                                       onResendCode,
                                   }: PasswordResetModalProps) => {
    const {
        state,
        setState,
        handleSendEmail,
        handleCodeChange,
        handleResendCode,
        handleVerifyCode,
        handleResetPassword,
        formatTime,
    } = usePasswordReset(email, onSendEmail, onVerifyCode, onResetPassword, onResendCode);

    if (!isOpen) return null;

    return (
        <div className={`${styles["overlay"]} ${isOpen ? styles["visible"] : ""}`} onClick={onClose}>
            <div className={styles["modal"]} onClick={(e) => { e.stopPropagation(); }}>
                {state.step === 1 && (
                    <>
                        <h2 className={styles["title"]}>Reset password</h2>
                        <p className={styles["description"]}>{"Type your email to reset password"}</p>
                        <input
                            type="email"
                            value={state.emailInput}
                            onInput={(e) => { setState((prev) => ({ ...prev, emailInput: e.currentTarget.value })); }}
                            placeholder="fox@foxmail.fox"
                            className={styles["easy-input"]}
                        />
                        {state.errorMessage && (
                            <div className={`${styles["line"]} ${styles["error-line"]}`}>
                                {state.errorMessage}
                            </div>
                        )}
                        <div className={styles["actions"]}>
                            <Button onClick={handleSendEmail} variant="primary" width={318} disabled={!state.emailInput}>
                                {"Confirm"}
                            </Button>
                        </div>
                    </>
                )}

                {state.step === 2 && (
                    <>
                        <h2 className={styles["title"]}>Check your email</h2>
                        <p className={styles["description"]}>{email ?? "Failed to receive mail"}</p>
                        <div className={styles["easy-input-container"]}>
                            {state.code.map((digit, index) => (
                                <input
                                    key={index}
                                    placeholder="0"
                                    className={`${styles["code-input"]} ${state.errorMessage ? styles["error"] : ""}`}
                                    value={digit}
                                    maxLength={1}
                                    onInput={(e) => { handleCodeChange(e, index); }}
                                />
                            ))}
                        </div>
                        {state.errorMessage && (
                            <div className={`${styles["line"]} ${styles["error-line"]}`}>
                                {state.errorMessage}
                            </div>
                        )}
                        <div className={styles["actions"]}>
                            <Button
                                onClick={handleVerifyCode}
                                variant="primary"
                                width={318}
                                disabled={state.code.some((digit) => !digit)}
                            >
                                {"Verify Code"}
                            </Button>
                        </div>
                        <div className={styles["resend-text"]}>
                            {state.isResendDisabled ? (
                                <>
                                    <span>Time until you can resend code</span>
                                    <div className={styles["timer-container"]}>
                                        <span className={styles["timer"]}>{formatTime(state.timer)}</span>
                                        <img className={styles["timer-icon"]} src={TimerIcon} alt="Timer" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span>
                                        Didn’t receive code?{" "}
                                        <a onClick={handleResendCode} className={styles["resend-link"]}>
                                            Send again
                                        </a>
                                    </span>
                                </>
                            )}
                        </div>
                    </>
                )}

                {state.step === 3 && (
                    <>
                        <h2 className={styles["title"]}>Enter new password</h2>
                        <p className={styles["description"]}>{"This will replace your old password"}</p>
                        <input
                            type="password"
                            value={state.password}
                            onInput={(e) => { setState((prev) => ({ ...prev, password: e.currentTarget.value })); }}
                            placeholder="New password"
                            className={styles["easy-input"]}
                            maxLength={128}
                        />
                        {state.errorMessage && (
                            <div className={`${styles["line"]} ${styles["error-line"]}`}>
                                {state.errorMessage}
                            </div>
                        )}
                        <div className={styles["actions"]}>
                            <Button
                                onClick={handleResetPassword}
                                variant="primary"
                                width={318}
                                disabled={state.password.length < 8 || state.password.length > 128}
                            >
                                {"Confirm"}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
