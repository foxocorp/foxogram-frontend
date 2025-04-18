import { apiMethods, getAuthToken } from "@services/API/apiMethods";
import { Logger } from "@utils/logger";
import type { ChatStore } from "./chatStore";
import { createChannelFromAPI, transformToMessage } from "./transforms";

export async function fetchCurrentUser(this: ChatStore): Promise<void> {
    if (this.currentUserId) return;
    const token = getAuthToken();
    if (!token) {
        this.clearAuthAndRedirect();
        return;
    }
    try {
        const user = await apiMethods.getCurrentUser();
        this.setCurrentUser(user.id);
        this.connectionError = null;
    } catch (error: any) {
        if (error.response?.status === 401 || error.code === "UNAUTHORIZED") {
            Logger.error(`Auth error: ${error}`);
            this.clearAuthAndRedirect();
        } else {
            Logger.error(`Failed fetchCurrentUser: ${error}`);
        }
    }
}

export async function fetchChannelsFromAPI(this: ChatStore): Promise<void> {
    if (!getAuthToken()) {
        this.clearAuthAndRedirect();
        return;
    }
    if (this.channels.length > 0 || this.activeRequests.has("channels")) return;
    this.activeRequests.add("channels");
    this.isLoading = true;
    try {
        const apiChannels = await apiMethods.userChannelsList();
        this.channels = apiChannels
            .map(createChannelFromAPI)
            .filter((c): c is any => c !== null);
    } catch (error: any) {
        Logger.error(`fetchChannelsFromAPI error: ${error}`);
        if (error.response?.status === 401 || error.code === "UNAUTHORIZED") {
            this.clearAuthAndRedirect();
        }
    } finally {
        this.activeRequests.delete("channels");
        this.isLoading = false;
    }
}

export async function fetchMessages(
    this: ChatStore,
    channelId: number,
    beforeTimestamp?: number,
): Promise<void> {
    if (!getAuthToken()) {
        this.clearAuthAndRedirect();
        return;
    }
    if (this.activeRequests.has(channelId) || !this.hasMoreMessagesByChannelId.get(channelId)) return;

    const isInitial = !beforeTimestamp;
    if (isInitial) this.isInitialLoad.set(channelId, true);
    this.activeRequests.add(channelId);
    const controller = new AbortController();
    this.abortControllers.set(channelId, controller);
    this.isLoadingHistory = true;

    try {
        const query: any = { limit: 50 };
        if (beforeTimestamp !== undefined) query.before = beforeTimestamp;
        const newMessages = await apiMethods.listMessages(channelId, query);
        const ordered = isInitial ? newMessages : [...newMessages].reverse();
        if (ordered.length) {
            if (isInitial) this.isInitialLoad.set(channelId, false);
            const existing = new Set(this.messagesByChannelId[channelId]?.map(m => m.id) ?? []);
            const transformed = ordered.map(transformToMessage).filter(m => !existing.has(m.id));
            this.messagesByChannelId[channelId] = isInitial
                ? transformed
                : [...(this.messagesByChannelId[channelId] ?? []), ...transformed];
            this.hasMoreMessagesByChannelId.set(channelId, newMessages.length === 30);
        }
    } catch (err: any) {
        if (err.name === "AbortError") {
            Logger.debug(`Request aborted: ${err}`);
        } else if (err.response?.status === 401 || err.code === "UNAUTHORIZED") {
            Logger.error(`Auth error: ${err}`);
            this.clearAuthAndRedirect();
        } else {
            Logger.error(`fetchMessages error: ${err}`);
        }
    } finally {
        this.activeRequests.delete(channelId);
        this.abortControllers.delete(channelId);
        this.isLoadingHistory = false;
    }
}

export async function sendMessage(
    this: ChatStore,
    content: string,
    files: File[] = [],
): Promise<void> {
    if (!this.currentChannelId || !this.currentUserId) return;
    this.isSendingMessage = true;
    try {
        const form = new FormData();
        form.append("content", content);
        files.forEach(f => { form.append("attachments", f); });
        const response = await apiMethods.createMessage(this.currentChannelId, form);
        const msg = transformToMessage(response);
        if (!this.messagesByChannelId[msg.channel.id]?.some(m => m.id === msg.id)) {
            this.messagesByChannelId[msg.channel.id] = [
                ...(this.messagesByChannelId[msg.channel.id] ?? []),
                msg,
            ];
            this.updateChannelLastMessage(msg.channel.id, msg);
        }
        this.playSendMessageSound();
    } catch (error: any) {
        Logger.error(`sendMessage error: ${error}`);
        this.connectionError = "Failed to send message";
    } finally {
        this.isSendingMessage = false;
    }
}

export async function retryMessage(
    this: ChatStore,
    messageId: number,
): Promise<void> {
    const msg = this.messagesByChannelId[this.currentChannelId!]?.find(m => m.id === messageId);
    if (!msg) return;
    await this.sendMessage(msg.content, msg.attachments);
    this.deleteMessage(messageId);
}
