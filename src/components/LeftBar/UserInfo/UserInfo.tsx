import { useState, useEffect } from "preact/hooks";
import { apiMethods } from "@services/API/apiMethods.ts";
import styles from "./UserInfo.module.css";
import settingsIcon from "@icons/navigation/settings.svg";
import accountSwitchIcon from "@icons/navigation/account-switch.svg";
import { UserInfoProps } from "@interfaces/interfaces.ts";
import { chatStore } from "@store/chat/chatStore.ts";

const UserInfo = ({ username, avatar, status }: UserInfoProps) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAccountSwitchOpen, setIsAccountSwitchOpen] = useState(false);
    const [userData, setUserData] = useState<{ username: string; avatar: string; status: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = async () => {
        try {
            const user = await apiMethods.getCurrentUser();
            setUserData({
                username: user.username,
                avatar: user.avatar,
                status: status ?? "Unknown",
            });
        } catch {
            setError("Failed to load user data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchUser();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className={styles["user-info"]}>
            <img
                src={userData?.avatar ?? avatar}
                alt={`${userData?.username ?? username} Avatar`}
                className={styles["user-avatar"]}
            />
            <div className={styles["user-details"]}>
                <p className={styles["username"]}>{userData?.username ?? username}</p>
                <p className={styles["status"]}>{chatStore.wsClient?.isConnected ? "Online" : "Offline"}</p>
            </div>
            <div className={styles["user-actions"]}>
                <img
                    src={accountSwitchIcon}
                    alt="Switch Account"
                    className={styles["action-icon"]}
                    onClick={() => { setIsAccountSwitchOpen(!isAccountSwitchOpen); }}
                />
                <img
                    src={settingsIcon}
                    alt="Settings"
                    className={styles["action-icon"]}
                    onClick={() => { setIsSettingsOpen(!isSettingsOpen); }}
                />
            </div>
        </div>
    );
};

export default UserInfo;