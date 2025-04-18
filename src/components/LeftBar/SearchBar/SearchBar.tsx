import { useState, useEffect, useRef } from "preact/hooks";
import styles from "./SearchBar.module.css";
import searchIcon from "@icons/navigation/magnifying-glass.svg";
import React from "react";

const platformMatchers: Record<string, RegExp> = {
    windows: /windows nt/i,
    mac: /mac(?:intosh| os x)/i,
    mobile: /mobile|android|iphone|ipad|ipod/i,
    linux: /linux/i,
};

const getPlatform = (): string => {
    const userAgent = navigator.userAgent.toLowerCase();
    for (const [platform, regex] of Object.entries(platformMatchers)) {
        if (regex.test(userAgent)) return platform;
    }
    return "unknown";
};

const getShortcut = (platform: string): string => {
    switch (platform) {
        case "mac":
            return "⌘+K";
        case "windows":
            return "Ctrl + K";
        case "linux":
            return "Ctrl + Shift + K";
        default:
            return "";
    }
};

const SearchBar = () => {
    const [query, setQuery] = useState("");
    const [platform] = useState(getPlatform());
    const [isSearchActive, setSearchActive] = useState(false);
    const [isBorderInactive, setBorderInactive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const ctrlPlatforms = ["windows", "linux"];
        const handleKeyDown = (event: KeyboardEvent) => {
            const isShortcut =
                (platform === "mac" && event.metaKey && event.code === "KeyK") ||
                (ctrlPlatforms.includes(platform) && event.ctrlKey && event.code === "KeyK");

            if (isShortcut) {
                event.preventDefault();
                activateSearch();
            } else if (event.code === "Escape" && isSearchActive) {
                deactivateSearch();
            }
        };

        const activateSearch = () => {
            setSearchActive(true);
            setBorderInactive(false);
            inputRef.current?.focus();

            setTimeout(() => {
                setBorderInactive(true);
            }, 1000);
        };

        const deactivateSearch = () => {
            setSearchActive(false);
            setQuery("");
            inputRef.current?.blur();
        };

        window.addEventListener("keydown", handleKeyDown, true);
        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [platform, isSearchActive]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target as HTMLInputElement | null;
        if (target) {
            setQuery(target.value);
        }
    };

    const shortcut = getShortcut(platform);

    return (
        <div
            className={`${styles["search-bar"]} ${isSearchActive ? styles["active"] : ""} ${isBorderInactive ? styles["inactive-border"] : ""}`}
        >
            <img src={searchIcon} alt="Search" className={styles["search-icon"]} />
            <input
                ref={inputRef}
                id="search-input"
                type="text"
                autoComplete="off"
                value={query}
                onInput={handleChange}
                placeholder={`Search (${shortcut})`}
                className={`${styles["search-input"]} ${isSearchActive ? styles["active-input"] : ""}`}
                autoFocus={isSearchActive}
                onBlur={() => { setSearchActive(false); }}
            />
        </div>
    );
};

export default SearchBar;
