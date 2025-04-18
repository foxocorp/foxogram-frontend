import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { APIOk } from "@foxogram/api-types";
import { useLocation } from "preact-iso";

export interface PasswordResetState {
    step: 1 | 2 | 3;
    emailInput: string;
    code: string[];
    password: string;
    errorMessage: string;
    isResendDisabled: boolean;
    timer: number;
}

export const usePasswordReset = (
    email: string,
    onSendEmail: (email: string) => Promise<APIOk>,
    onVerifyCode: (code: string) => Promise<APIOk>,
    onResetPassword: (password: string) => Promise<APIOk | undefined>,
    onResendCode: () => Promise<APIOk>,
) => {
    const [state, setState] = useState<PasswordResetState>({
        step: 1,
        emailInput: email,
        code: new Array<string>(6).fill(""),
        password: "",
        errorMessage: "",
        isResendDisabled: true,
        timer: 60,
    });

    const timerRef = useRef<number>(60);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const location = useLocation();

    useEffect(() => {
        if (state.step === 2) {
            timerRef.current = 60;
            setState((prev) => ({ ...prev, timer: timerRef.current, isResendDisabled: true }));

            intervalRef.current = setInterval(() => {
                if (timerRef.current <= 1) {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                    }
                    setState((prev) => ({ ...prev, isResendDisabled: false, timer: 0 }));
                    timerRef.current = 0;
                } else {
                    timerRef.current -= 1;
                    setState((prev) => ({ ...prev, timer: timerRef.current }));
                }
            }, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [state.step]);

    const handleCodeChange = (e: React.FormEvent<HTMLInputElement>, index: number) => {
        const inputElement = e.currentTarget;
        const value = inputElement.value;

        if (/^\d$/.test(value)) {
            setState((prev) => {
                const updatedCode = [...prev.code];
                updatedCode[index] = value;
                if (index < 5 && value) {
                    const nextInput = inputElement.nextElementSibling as HTMLInputElement | null;
                    if (nextInput) {
                        nextInput.focus();
                    }
                }
                return { ...prev, code: updatedCode };
            });
        } else {
            inputElement.value = "";
        }
    };

    const handleSendEmail = useCallback(async () => {
        const isValidEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(state.emailInput);
        if (!isValidEmail) {
            setState((prev) => ({ ...prev, errorMessage: "Incorrect format" }));
            return;
        }

        try {
            await onSendEmail(state.emailInput);
            setState((prev) => ({ ...prev, step: 2, errorMessage: "" }));
        } catch {
            setState((prev) => ({
                ...prev,
                errorMessage: "Incorrect format",
            }));
        }
    }, [state.emailInput, onSendEmail]);

    const handleVerifyCode = useCallback(async () => {
        const fullCode = state.code.join("");
        if (fullCode.length === 6) {
            try {
                await onVerifyCode(fullCode);
                setState((prev) => ({ ...prev, step: 3, errorMessage: "" }));
            } catch (error) {
                setState((prev) => ({
                    ...prev,
                    errorMessage: "Incorrect format",
                }));
            }
        } else {
            setState((prev) => ({ ...prev, errorMessage: "Incorrect format" }));
        }
    }, [state.code, onVerifyCode]);

    const handleResetPassword = useCallback(async () => {
        if (state.password.length >= 8 && state.password.length <= 128) {
            try {
                await onResetPassword(state.password);
                location.route("/auth/login");
            } catch (error) {
                setState((prev) => ({
                    ...prev,
                    errorMessage: "Incorrect format",
                }));
            }
        } else {
            setState((prev) => ({
                ...prev,
                errorMessage: "Incorrect format",
            }));
        }
    }, [state.password, onResetPassword]);

    const handleResendCode = useCallback(async () => {
        try {
            await onResendCode();
            setState((prev) => ({ ...prev, timer: 60, isResendDisabled: true }));
        } catch (error) {
            setState((prev) => ({
                ...prev,
                errorMessage: "Incorrect format",
            }));
        }
    }, [onResendCode]);

    const formatTime = (time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    return {
        state,
        setState,
        handleSendEmail,
        handleCodeChange,
        handleVerifyCode,
        handleResetPassword,
        handleResendCode,
        formatTime,
    };
};
