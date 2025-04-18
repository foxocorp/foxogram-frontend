import { action, flow, makeAutoObservable, observable, runInAction } from "mobx";
import { apiMethods, getAuthToken } from "@services/API/apiMethods";
import { APIMessage, APIUser, APIChannel, ChannelType, UserType, UserFlags, APIMember, MemberPermissions } from "@foxogram/api-types";
import { Channel, Member, Message, User, Attachment } from "@interfaces/interfaces";
import { WebSocketClient } from "../gateway/webSocketClient";
import { GatewayDispatchEvents } from "@foxogram/gateway-types";
import { initWebSocket } from "../gateway/initWebSocket";
import { Logger } from "../utils/logger";

const fallbackMember: APIMember = {
    id: 0,
    user: {
        id: 0,
        avatar: "",
        display_name: "",
        username: "",
        email: "",
        flags: UserFlags.Disabled,
        type: UserType.User,
        created_at: Date.now(),
    },
    channel: {
        id: 0,
        name: "",
        display_name: "",
        icon: "",
        type: ChannelType.DM,
        member_count: 0,
        owner: {
            id: 0,
            avatar: "",
            display_name: "",
            username: "",
            email: "",
            flags: UserFlags.Disabled,
            type: UserType.User,
            created_at: Date.now(),
        },
        created_at: Date.now(),
    },
    permissions: MemberPermissions.SendMessages,
    joined_at: Date.now(),
};

class ChatStore {
    messagesByChannelId: Record<number, Message[]> = {};
    channels: Channel[] = [];
    currentChannelId: number | null = null;
    currentUserId: number | null = null;
    isLoading = false;
    isSendingMessage = false;
    connectionError: string | null = null;
    wsClient: WebSocketClient | null = null;
    private activeRequests = new Set<string | number>();
    hasMoreMessagesByChannelId = observable.map<number, boolean>();
    private abortControllers = new Map<number, AbortController>();
    isWsInitialized = false;
    isLoadingHistory = false;
    isInitialLoad = observable.map<number, boolean>();

    constructor() {
        makeAutoObservable(this, {
            messagesByChannelId: observable,
            channels: observable,
            currentChannelId: observable,
            currentUserId: observable,
            isLoading: observable,
            isSendingMessage: observable,
            connectionError: observable,
            isWsInitialized: observable,
            isInitialLoad: observable,

            fetchChannelsFromAPI: action,
            handleNewMessage: action,
            updateMessage: action,
            deleteMessage: action,
            setCurrentUser: action,

            initializeStore: flow,
        }, { autoBind: true });
    }

    async retryMessage(messageId: number) {
        const message = this.messagesByChannelId[this.currentChannelId]
            ?.find(m => m.id === messageId);

        if (message) {
            await this.sendMessage(message.content, message.attachments);
            this.deleteMessage(messageId);
        }
    }

    setCurrentUser = action((userId: number) => {
        try {
            this.currentUserId = userId;
        } catch (error) {
            Logger.error(`Error while setting current user: ${userId}`);
        }
    });

    setHasMoreMessages = action((channelId: number, hasMore: boolean) => {
        this.hasMoreMessagesByChannelId.set(channelId, hasMore);
    });

    updateMessage = action((messageId: number, newContent: string) => {
        const channelId = this.currentChannelId;
        if (!channelId) return;

        const messages = this.messagesByChannelId[channelId];
        if (!messages) return;

        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1 || !messages[messageIndex]) return;

        runInAction(() => {
            const msg = messages[messageIndex];
            if (msg) {
                msg.content = newContent;
            }
        });
    });

    deleteMessage = action((messageId: number) => {
        const channelId = this.currentChannelId;
        if (!channelId) return;

        runInAction(() => {
            const messages = this.messagesByChannelId[channelId];
            if (messages) {
                this.messagesByChannelId[channelId] = messages.filter(m => m.id !== messageId);
            }
        });
    });

    *initializeStore() {
        try {
            yield this.fetchCurrentUser();
            yield this.fetchChannelsFromAPI();
            this.initializeWebSocket();
        } catch (error) {
            Logger.error(error instanceof Error ? error.message : "An unknown error occurred");
            runInAction(() => {
                this.connectionError = "Initialization error";
            });
        }
    }

    private initializeWebSocket() {
        if (this.wsClient?.isConnected || this.isWsInitialized || !getAuthToken()) return;
        this.isWsInitialized = true;

        const authToken = getAuthToken();
        if (!authToken) return;

        this.wsClient = initWebSocket(authToken, () => {
            this.handleHistorySync();
            localStorage.removeItem("authToken");
            window.location.href = "/auth/login";
        });

        this.setupWebSocketHandlers();
        this.wsClient.connect();
    }

    private handleHistorySync = action(() => {
        if (!this.currentChannelId) return;
        const currentMessages = this.messagesByChannelId[this.currentChannelId];
        if (currentMessages?.length) return;
        this.fetchMessages(this.currentChannelId).catch((err: unknown) => { Logger.error(err instanceof Error ? err.message : "An unknown error occurred");});
    });

    private setupWebSocketHandlers() {
        if (!this.wsClient) return;

        const messageHandler = (message: APIMessage) => {
            if (!this.messagesByChannelId[message.channel.id]?.some(m => m.id === message.id)) {
                this.handleNewMessage(message);
            }
        };

        this.wsClient.on(GatewayDispatchEvents.MessageCreate, messageHandler);
    }

    private clearAuthAndRedirect() {
        runInAction(() => {
            localStorage.removeItem("authToken");
            if (!window.location.pathname.startsWith("/auth/login")) {
                window.location.href = "/auth/login";
            }
        });
    }

    async fetchCurrentUser() {
        if (this.currentUserId) return;
        const token = getAuthToken();
        if (!token) {
            this.clearAuthAndRedirect();
            return;
        }

        try {
            const user = await apiMethods.getCurrentUser();
            runInAction(() => {
                this.setCurrentUser(user.id);
                this.connectionError = null;
            });
        } catch (error) {
            if ((error as any)?.response?.status === 401 || (error as any)?.code === "UNAUTHORIZED") {
                Logger.error(`Authorization error occurred ${error}`);
                this.clearAuthAndRedirect();
            } else {
                Logger.error(`Failed to fetch current user ${error}`);
            }
        }
    }

    async fetchChannelsFromAPI(): Promise<void> {
        if (!getAuthToken()) {
            this.clearAuthAndRedirect();
            return;
        }

        try {
            if (this.channels.length > 0 || this.activeRequests.has("channels")) return;
            this.activeRequests.add("channels");

            runInAction(() => (this.isLoading = true));
            const apiChannels = await apiMethods.userChannelsList();

            runInAction(() => {
                this.channels = apiChannels
                    .map(c => this.createChannelFromAPI(c))
                    .filter((c): c is Channel => c !== null);
            });
        } catch (error) {
            Logger.error(error instanceof Error ? error.message : "An unknown error occurred");
            if (this.isAuthError(error)) {
                this.clearAuthAndRedirect();
            }
        } finally {
            this.activeRequests.delete("channels");
            runInAction(() => (this.isLoading = false));
        }
    }

    private isAuthError(error: unknown): boolean {
        return (
            (error as any)?.response?.status === 401 ||
            (error as any)?.message?.includes("auth") ||
            (error as any)?.code === "UNAUTHORIZED"
        );
    }

    async fetchMessages(channelId: number, beforeTimestamp?: number) {
        if (!getAuthToken()) {
            this.clearAuthAndRedirect();
            return;
        }

        if (this.shouldAbortRequest(channelId)) return;

        const isInitial = !beforeTimestamp;
        if (isInitial) this.isInitialLoad.set(channelId, true);
        this.startRequest(channelId);

        try {
            const query = {
                ...(beforeTimestamp !== undefined && { before: beforeTimestamp }),
                limit: 50,
            };

            const newMessages = await apiMethods.listMessages(channelId, query);
            this.processNewMessages(channelId, newMessages, isInitial);
        } catch (error) {
            this.handleFetchError(error);
        } finally {
            this.endRequest(channelId);
        }
    }

    private processNewMessages(channelId: number, newMessages: APIMessage[], isInitial: boolean) {
        if (!newMessages.length) return;

        const orderedMessages = isInitial
            ? newMessages
            : [...newMessages].reverse();

        runInAction(() => {
            if (isInitial) this.isInitialLoad.set(channelId, false);
            this.updateMessages(channelId, orderedMessages, !isInitial);
            this.setHasMoreMessages(channelId, newMessages.length === 30);
        });
    }

    private shouldAbortRequest(channelId: number): boolean {
        return this.activeRequests.has(channelId) || !this.hasMoreMessagesByChannelId.get(channelId);
    }

    private startRequest(channelId: number) {
        this.activeRequests.add(channelId);
        this.abortControllers.set(channelId, new AbortController());
        this.isLoadingHistory = true;
    }

    private updateMessages(channelId: number, newMessages: APIMessage[], isHistory: boolean) {
        const existingIds = new Set(this.messagesByChannelId[channelId]?.map(m => m.id) ?? []);
        const transformed = newMessages
            .map(this.transformToMessage)
            .filter(msg => !existingIds.has(msg.id));

        this.messagesByChannelId[channelId] = isHistory
            ? [...transformed, ...(this.messagesByChannelId[channelId] ?? [])]
            : [...(this.messagesByChannelId[channelId] ?? []), ...transformed];
    }

    private handleFetchError(error: unknown) {
        if ((error as Error).name === "AbortError") {
            Logger.debug(`Request aborted ${error}`);
        }
        else if ((error as any)?.response?.status === 401 || (error as any)?.code === "UNAUTHORIZED") {
            Logger.error(`Authorization error occurred ${error}`);
            this.clearAuthAndRedirect();
        } else {
            Logger.error(`Error fetching messages ${error}`);
        }
    }

    private endRequest(channelId: number) {
        this.activeRequests.delete(channelId);
        this.abortControllers.delete(channelId);
        this.isLoadingHistory = false;
    }

    handleNewMessage(apiMessage: APIMessage) {
        const message = this.transformToMessage(apiMessage);
        const channelId = message.channel.id;

        runInAction(() => {
            if (!this.messagesByChannelId[channelId]?.some(m => m.id === message.id)) {
                this.messagesByChannelId[channelId] = [
                    ...(this.messagesByChannelId[channelId] ?? []),
                    message,
                ];
                this.updateChannelLastMessage(channelId, message);
            }
        });
    }

    updateChannelLastMessage = action((channelId: number, message: Message) => {
        this.channels = this.channels.map(channel =>
            channel.id === channelId
                ? new Channel({ ...channel, lastMessage: message })
                : channel,
        );
    });

    setCurrentChannel = action(async (channelId: number | null) => {
        this.currentChannelId = channelId;
        if (channelId) {
            localStorage.setItem("currentChannelId", String(channelId));
            await this.loadChannelData(channelId);
        } else {
            localStorage.removeItem("currentChannelId");
        }
    });

    private loadChannelData = action(async (channelId: number) => {
        this.setHasMoreMessages(channelId, true);
        if (!this.messagesByChannelId[channelId]?.length) {
            await this.fetchMessages(channelId);
        }
    });

    private playSendMessageSound() {
        const audio = new Audio("public/sounds/fg_sfx.mp3");
        audio.play().catch((error: unknown) => {
            Logger.error(error instanceof Error ? error.message : "An unknown error occurred");
        });
    }

    async sendMessage(content: string, files: File[] = []) {
        if (!this.currentChannelId || !this.currentUserId) return;

        try {
            runInAction(() => (this.isSendingMessage = true));

            const formData = new FormData();
            formData.append("content", content);

            for (const file of files) {
                formData.append("attachments", file);
            }

            const response = await apiMethods.createMessage(this.currentChannelId, formData);

            runInAction(() => { this.processSentMessage(response); });

            this.playSendMessageSound();
        } catch (error) {
            this.handleMessageSendError(error);
        } finally {
            runInAction(() => (this.isSendingMessage = false));
        }
    }

    private processSentMessage(response: APIMessage) {
        const newMessage = this.transformToMessage(response);
        const channelId = newMessage.channel.id;

        if (newMessage.attachments.length) {
            newMessage.attachments.forEach((attachment) => {
                console.log("Attachment received:", attachment);
            });
        }

        if (!this.messagesByChannelId[channelId]?.some(m => m.id === newMessage.id)) {
            this.messagesByChannelId[channelId] = [
                ...(this.messagesByChannelId[channelId] ?? []),
                newMessage,
            ];
            this.updateChannelLastMessage(channelId, newMessage);
        }
    }

    private handleMessageSendError(error: unknown) {
        Logger.error(error instanceof Error ? error.message : "An unknown error occurred");
        runInAction(() => {
            this.connectionError = "Failed to send message";
        });
    }

    private transformApiUserToUser = (apiUser?: APIUser): User => {
        if (!apiUser) {
            return new User({
                id: 0,
                avatar: "",
                display_name: "Unknown User",
                username: "unknown",
                email: "",
                flags: UserFlags.Disabled,
                type: UserType.User,
                created_at: Date.now(),
                channels: [],
            });
        }

        return new User({
            id: apiUser.id || 0,
            avatar: apiUser.avatar || "",
            display_name: apiUser.display_name || apiUser.username || "Unknown User",
            username: apiUser.username || "unknown",
            email: apiUser.email ?? "",
            flags: apiUser.flags || UserFlags.Disabled,
            type: apiUser.type || UserType.User,
            created_at: apiUser.created_at || Date.now(),
            channels: apiUser.channels ?? [],
        });
    };

    private transformApiChannel = (apiChannel?: APIChannel): Channel => {
        if (!apiChannel) {
            return new Channel({
                id: 0,
                name: "deleted-channel",
                display_name: "Deleted Channel",
                icon: "",
                type: ChannelType.DM,
                member_count: 0,
                owner: this.transformApiUserToUser(),
                created_at: Date.now(),
                last_message: null,
            });
        }

        return new Channel({
            id: apiChannel.id || 0,
            name: apiChannel.name || "unnamed-channel",
            display_name: apiChannel.display_name || apiChannel.name || "Unnamed Channel",
            icon: apiChannel.icon || "",
            type: this.normalizeChannelType(apiChannel.type),
            member_count: apiChannel.member_count || 0,
            owner: this.transformApiUserToUser(apiChannel.owner),
            created_at: apiChannel.created_at || Date.now(),
            last_message: apiChannel.last_message
                ? this.transformToMessage(apiChannel.last_message)
                : null,
        });
    };

    private createChannelFromAPI(c: APIChannel): Channel | null {
        try {
            return new Channel({
                id: c.id || 0,
                name: c.name || "unnamed-channel",
                display_name: c.display_name || c.name || "Unnamed Channel",
                icon: c.icon || "",
                type: this.normalizeChannelType(c.type),
                member_count: c.member_count || 0,
                owner: this.transformApiUserToUser(c.owner),
                created_at: c.created_at || Date.now(),
                lastMessage: c.last_message
                    ? new Message(this.transformToMessage(c.last_message))
                    : null,
            });
        } catch (error) {
            Logger.error(error instanceof Error ? error.message : "An unknown error occurred");
            return null;
        }
    }

    private transformToMessage = (data: APIMessage): Message => {
        const author: APIMember = data.author || fallbackMember;

        const attachments: Attachment[] = (data.attachments || []).map(att => ({
            id: att.id,
            content_type: att.content_type,
            filename: att.filename,
            flags: att.flags,
        }));

        return new Message({
            ...data,
            attachments,
            author: this.transformApiMember(author),
            channel: this.transformApiChannel(data.channel),
        });
    };

    private transformApiMember = (apiMember: APIMember): Member => {
        return new Member({
            ...apiMember,
            user: this.transformApiUserToUser(apiMember.user),
            channel: this.transformApiChannel(apiMember.channel),
            permissions: this.normalizePermissions(apiMember.permissions),
        });
    };

    private normalizePermissions(permissions: string | number): number {
        if (typeof permissions === "string") {
            return parseInt(permissions, 10) || MemberPermissions.SendMessages;
        }
        return permissions;
    }

    private normalizeChannelType(type: string | ChannelType | undefined): ChannelType {
        if (typeof type === "string") {
            const channelType = ChannelType[type as keyof typeof ChannelType];
            return channelType ?? ChannelType.DM;
        }
        return type ?? ChannelType.DM;
    }
}

export const chatStore = new ChatStore();
