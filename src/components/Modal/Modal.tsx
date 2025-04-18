import { useEffect } from "preact/hooks";
import styles from "./Modal.module.css";
import { Button } from "@components/Base/Buttons/Button";
import { JSX } from "preact";

interface ModalProps {
    title: string;
    description: string;
    onClose: () => void;
    actionButtons?: JSX.Element[];
    icon?: string | undefined;
}

export const Modal = ({ title, description, onClose, actionButtons = [], icon }: ModalProps) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => { window.removeEventListener("keydown", handleKeyDown); };
    }, [onClose]);

    return (
        <div className={`${styles["overlay"]} ${styles["visible"]}`} onClick={onClose}>
            <div className={styles["modal"]} onClick={(e) => { e.stopPropagation(); }}>
                <h2 className={styles["title"]}>{title}</h2>
                <div className={styles["description"]}>
                    <span>{typeof description === "object" ? JSON.stringify(description) : description}</span>
                </div>
                <div className={styles["actions"]}>
                    {actionButtons.length > 0 ? (actionButtons) : (
                        <Button onClick={onClose} fontWeight={500} variant="primary" icon={icon}>
                            Close
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
