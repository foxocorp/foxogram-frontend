import { getAuthToken } from "@services/API/apiMethods";
import { initWebSocket } from "../../gateway/initWebSocket";
import { GatewayDispatchEvents } from "@foxogram/gateway-types";
import { Logger } from "@utils/logger";
import type { ChatStore } from "./chatStore";

export function clearAuthAndRedirect(this: ChatStore): void {
    this.wsClient?.disconnect?.();
    localStorage.removeItem("authToken");
    if (!window.location.pathname.startsWith("/auth/login")) {
        window.location.href = "/auth/login";
    }
}

export function initializeWebSocket(this: ChatStore): void {
    if (this.wsClient?.isConnected || this.isWsInitialized || !getAuthToken()) return;
    this.isWsInitialized = true;
    const token = getAuthToken();
    if (!token) return;
    this.wsClient = initWebSocket(token, () => {
        this.handleHistorySync();
        this.clearAuthAndRedirect();
    });
    this.setupWebSocketHandlers();
    this.wsClient.connect();
}

export function handleHistorySync(this: ChatStore): void {
    if (!this.currentChannelId) return;
    if (this.messagesByChannelId[this.currentChannelId]?.length) return;
    this.fetchMessages(this.currentChannelId).catch(err => {
        Logger.error(`History sync error: ${err}`);
    });
}

export function setupWebSocketHandlers(this: ChatStore): void {
    if (!this.wsClient) return;
    this.wsClient.on(
        GatewayDispatchEvents.MessageCreate,
        (message) => {
            if (!this.messagesByChannelId[message.channel.id]?.some(m => m.id === message.id)) {
                this.handleNewMessage(message);
            }
        }
    );
}
