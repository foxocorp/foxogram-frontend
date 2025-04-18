import { useState, useEffect } from "preact/hooks";

export const useTimer = (initialTime: number, onTimeout: () => void) => {
    const [time, setTime] = useState(initialTime);

    useEffect(() => {
        if (time > 0) {
            const interval = setInterval(() => { setTime((prev) => prev - 1); }, 1000);
            return () => { clearInterval(interval); };
        } 
            onTimeout();
            return undefined;
        
    }, [time, onTimeout]);

    return { time, resetTimer: () => { setTime(initialTime); } };
};

export const useEmailVerification = (
    onVerify: (code: string) => Promise<void>, onResendCode: () => Promise<void>) => {
    const [code, setCode] = useState<string[]>(Array(6).fill(""));
    const [isResendDisabled, setIsResendDisabled] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [codeErrors, setCodeErrors] = useState<boolean[]>(Array(6).fill(false));

    const { time, resetTimer } = useTimer(60, () => { setIsResendDisabled(false); });

    const resetErrorState = () => {
        if (error) {
            setError(false);
        }
    };

    const handleCodeChange = (e: Event, index: number) => {
        const inputElement = e.currentTarget as HTMLInputElement;
        const value = inputElement.value;

        if (/^\d$/.test(value)) {
            setCodeErrors((prev) => {
                const updatedErrors = [...prev];
                updatedErrors[index] = false;
                return updatedErrors;
            });

            setCode((prev) => {
                const updatedCode = [...prev];
                updatedCode[index] = value;

                if (index < 5 && value) {
                    const nextInput = inputElement.nextElementSibling as HTMLInputElement | null;
                    nextInput?.focus();
                }
                return updatedCode;
            });
        } else {
            inputElement.value = "";
        }
    };

    const handleBackspace = (e: KeyboardEvent, index: number) => {
        const inputElement = e.currentTarget as HTMLInputElement;
        if (e.key === "Backspace") {
            if (!code[index] && index > 0) {
                setCode((prev) => {
                    const updatedCode = [...prev];
                    updatedCode[index - 1] = "";
                    return updatedCode;
                });
                const previousInput = inputElement.previousElementSibling as HTMLInputElement | null;
                previousInput?.focus();
            } else if (code[index]) {
                setCode((prev) => {
                    const updatedCode = [...prev];
                    updatedCode[index] = "";
                    return updatedCode;
                });
            }
        }
        resetErrorState();
    };

    const handleVerify = async () => {
        const fullCode = code.join("");
        const newErrors = code.map((digit) => digit === "");

        if (newErrors.every((error) => !error)) {
            try {
                await onVerify(fullCode);
                setError(true);
            } catch (err) {
                console.error("[ERROR] Verification failed:", err);
                setError(true);
                setCodeErrors(Array(6).fill(true));
            }
        } else {
            console.log("[ERROR] Code validation failed");
            setError(true);
        }
    };

    const handleInputChange = (e: Event, index: number) => {
        handleCodeChange(e, index);
        setCodeErrors((prev) => {
            const updatedErrors = [...prev];
            updatedErrors[index] = false;
            return updatedErrors;
        });

        resetErrorState();
    };

    const handleResendCode = async () => {
        setIsResendDisabled(true);
        resetTimer();
        try {
            await onResendCode();
        } catch (error) {
            console.error("Resend failed:", error);
        }
    };

    const handlePaste = (event: ClipboardEvent) => {
        event.preventDefault();
        const pastedText = event.clipboardData?.getData("text") ?? "";
        if (pastedText.trim() === "") return;
        const sanitizedCode: string[] = pastedText.replace(/\D/g, "").slice(0, 6).split("");
        const paddedCode: string[] = sanitizedCode.concat(new Array(6 - sanitizedCode.length).fill(""));

        setCode(paddedCode);
    };

    return {
        code,
        setCode,
        codeErrors,
        error,
        isResendDisabled,
        time,
        handleCodeChange,
        handleBackspace,
        handleVerify,
        handleResendCode,
        handleInputChange,
        handlePaste,
    };
};