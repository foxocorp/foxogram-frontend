import { useState, useEffect, useRef } from "preact/hooks";
import { SidebarProps } from "@interfaces/interfaces.ts";
import styles from "./Sidebar.module.css";
import SearchBar from "./SearchBar/SearchBar.tsx";
import ChatList from "@components/LeftBar/ChatList/ChatList";
import UserInfo from "./UserInfo/UserInfo.tsx";

const MIN_SIDEBAR_WIDTH = 300;
const DEFAULT_DESKTOP_WIDTH = 460;

interface Props extends SidebarProps {
    isMobile?: boolean;
}

const Sidebar = ({ chats, onSelectChat, currentUser, isMobile }: Props) => {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState<number>(DEFAULT_DESKTOP_WIDTH);
    const [maxWidth, setMaxWidth] = useState<number>(
        Math.min(600, window.innerWidth * 0.8),
    );

    const isResizing = useRef<boolean>(false);
    const startX = useRef<number>(0);
    const startWidth = useRef<number>(DEFAULT_DESKTOP_WIDTH);

    useEffect(() => {
        if (!isMobile) {
            const savedWidth = localStorage.getItem("sidebarWidth");
            if (savedWidth) {
                const parsed = parseInt(savedWidth, 10);
                if (!isNaN(parsed)) {
                    setWidth(parsed);
                    startWidth.current = parsed;
                }
            }
        }
    }, [isMobile]);

    useEffect(() => {
        if (isMobile) {
            setWidth(window.innerWidth);
        } else {
            const savedWidth = localStorage.getItem("sidebarWidth");
            if (savedWidth) {
                const parsed = parseInt(savedWidth, 10);
                if (!isNaN(parsed)) {
                    setWidth(parsed);
                } else {
                    setWidth(DEFAULT_DESKTOP_WIDTH);
                }
            } else {
                setWidth(DEFAULT_DESKTOP_WIDTH);
            }
        }
    }, [isMobile]);

    useEffect(() => {
        function handleResize() {
            setMaxWidth(Math.min(600, window.innerWidth * 0.8));
        }
        window.addEventListener("resize", handleResize);
        return () => { window.removeEventListener("resize", handleResize); };
    }, []);

    const handleMouseDown = (event: MouseEvent) => {
        if (isMobile) return;
        event.preventDefault();
        isResizing.current = true;
        startX.current = event.clientX;
        startWidth.current = width;

        document.addEventListener("mousemove", handleDocumentMouseMove);
        document.addEventListener("mouseup", handleDocumentMouseUp);
    };

    const handleDocumentMouseMove = (event: MouseEvent) => {
        if (!isResizing.current || isMobile) return;

        const delta = event.clientX - startX.current;
        let newWidth = startWidth.current + delta;
        if (newWidth < MIN_SIDEBAR_WIDTH) newWidth = MIN_SIDEBAR_WIDTH;
        if (newWidth > maxWidth) newWidth = maxWidth;
        setWidth(newWidth);
    };

    const handleDocumentMouseUp = () => {
        if (isResizing.current) {
            isResizing.current = false;
            if (!isMobile) {
                localStorage.setItem("sidebarWidth", String(width));
            }
            document.removeEventListener("mousemove", handleDocumentMouseMove);
            document.removeEventListener("mouseup", handleDocumentMouseUp);
        }
    };

    const sidebarStyle = isMobile ? { width: "100%" } : { width: `${width}px` };

    return (
        <div ref={sidebarRef} className={styles["sidebar"]} style={sidebarStyle}>
            <div className={styles["sidebar-header"]}>
                <SearchBar />
            </div>
            <div className={styles["sidebar-chats"]}>
                <ChatList
                    chats={chats}
                    onSelectChat={onSelectChat}
                    currentUser={currentUser}
                />
            </div>
            <div className={styles["sidebar-footer"]}>
                <UserInfo
                    username={currentUser.toString()}
                    avatar="/favicon-96x96.png"
                    status="Online"
                />
            </div>
            {!isMobile && (
                <div className={styles["resizer"]} onMouseDown={handleMouseDown} />
            )}
        </div>
    );
};

export default Sidebar;
