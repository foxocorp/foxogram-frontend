import {
    APIChannel,
    APIMember,
    APIMessage,
    APIUser,
    ChannelType,
    MemberPermissions,
    UserFlags,
    UserType,
} from "@foxogram/api-types";
import React from "react";

/* === Interface Definitions === */

export interface ConnectionManager {
    startHeartbeat(
        interval: number,
        sendHeartbeat: () => void,
        onMissed: () => void
    ): ReturnType<typeof setInterval>;
    cleanupHeartbeat(id: ReturnType<typeof setInterval> | null): void;
    scheduleReconnect: (
        isExplicitClose: boolean,
        currentAttempts: number,
        maxReconnectAttempts: number,
        currentDelay: number,
        reconnectFn: () => void
    ) => ReturnType<typeof setTimeout> | null;
    checkConnectionHealth: (
        isConnected: boolean,
        heartbeatAckReceived: boolean,
        reconnectFn: () => void,
        delay: number
    ) => void;
}

export class Member {
    id: number;
    user: User;
    channel: Channel;
    permissions: MemberPermissions;
    joined_at: number;

    constructor(data: { id: number; user: User; channel: Channel; permissions: number; joined_at: number }) {
        this.id = data.id;
        this.user = new User(data.user);
        this.channel = new Channel(data.channel);
        this.permissions = data.permissions;
        this.joined_at = data.joined_at;
    }

    toAPIMember(): APIMember {
        return {
            id: this.id,
            user: this.user.toAPIUser(),
            channel: this.channel.toAPIChannel(),
            permissions: this.permissions,
            joined_at: this.joined_at,
        };
    }
}

export class User {
    id: number;
    channels: number[];
    avatar: string;
    display_name: string;
    username: string;
    email?: string | undefined;
    flags: UserFlags;
    type: UserType;
    created_at: number;

    constructor(data: {
        id: number;
        channels?: number[];
        avatar: string;
        display_name: string;
        username: string;
        email: string | undefined;
        flags: UserFlags;
        type: UserType;
        created_at: number;
    }) {
        this.id = data.id;
        this.channels = data.channels ?? [];
        this.avatar = data.avatar;
        this.display_name = data.display_name;
        this.username = data.username;
        this.email = data.email ?? "";
        this.flags = data.flags;
        this.type = data.type;
        this.created_at = data.created_at;
    }

    toAPIUser(): APIUser {
        return {
            id: this.id,
            channels: this.channels,
            avatar: this.avatar,
            display_name: this.display_name,
            username: this.username,
            email: this.email ?? "",
            flags: this.flags,
            type: this.type,
            created_at: this.created_at,
        };
    }
}

export class Message {
    id: number;
    content: string;
    author: Member;
    channel: Channel;
    attachments: Attachment[];
    created_at: number;

    constructor(data: {
        id?: number;
        content?: string;
        author: APIMember;
        channel: APIChannel;
        attachments?: Attachment[];
        created_at?: number;
    }) {
        this.id = data.id ?? 0;
        this.content = data.content ?? "";
        this.author = new Member(data.author);
        this.channel = new Channel(data.channel);
        this.attachments = data.attachments ?? [];
        this.created_at = data.created_at ?? Date.now();
    }

    transformToAPIMessage(): APIMessage {
        return {
            id: this.id,
            content: this.content,
            author: this.author.toAPIMember(),
            channel: this.channel.toAPIChannel(),
            attachments: this.attachments,
            created_at: this.created_at,
        };
    }
}

export class Channel {
    id: number;
    name: string;
    display_name: string;
    icon: string;
    type: ChannelType;
    member_count: number;
    owner: User;
    created_at: number;
    lastMessage: Message | null;

    constructor(data: {
        id: number;
        name: string;
        display_name?: string;
        icon?: string;
        type: ChannelType | string;
        member_count: number;
        owner: User;
        created_at: number;
        lastMessage?: Message | null;
    }) {
        this.id = data.id;
        this.name = data.name || "Unnamed Channel";
        this.display_name = data.display_name ?? this.name;
        this.icon = data.icon ?? "";
        this.type = Object.values(ChannelType).includes(data.type as ChannelType)
            ? (data.type as ChannelType)
            : ChannelType.DM;
        this.member_count = data.member_count;
        this.owner = data.owner;
        this.created_at = data.created_at;
        this.lastMessage = data.lastMessage ?? null;
    }

    toAPIChannel(): {
        id: number;
        name: string;
        display_name: string;
        icon: string;
        type: ChannelType;
        member_count: number;
        owner: APIUser;
        created_at: number;
        last_message: APIMessage | null
    } {
        return {
            id: this.id,
            name: this.name,
            display_name: this.display_name,
            icon: this.icon,
            type: this.type,
            member_count: this.member_count,
            owner: this.owner.toAPIUser(),
            created_at: this.created_at,
            last_message: this.lastMessage ? this.lastMessage.transformToAPIMessage() : null,
        };
    }
}

/* === Props Section === */

/**
 * Chat Props
 */

export interface ChatWindowProps {
    channel: Channel;
    currentUserId: number;
}

export interface ChatListProps {
    chats: Channel[];
    onSelectChat: (chat: Channel) => void;
    currentUser: number;
}

export interface ChatHeaderProps {
    avatar: string | null;
    displayName?: string | null;
    username: string;
    channelId: number;
}

export interface ChatItemProps {
    chat: Channel,
    onSelectChat: (chat: Channel) => void,
    isActive: boolean,
    currentUser: number,
}

export interface MessageGroupProps {
    messages: Message[];
    currentUserId: number;
}

export interface MessageItemProps {
    content: string;
    created_at: number;
    author: Member;
    currentUserId: number;
    showAuthorName: boolean;
    attachments: Attachment[];
    status?: "sending" | "sent" | "failed";
    onRetry?: () => void;
    onDelete?: () => void;
}

export interface Attachment {
    id: string;
    content_type: string;
    filename: string;
    flags: number;
}

/**
 * Message Prop
 */

export interface MessageListProps {
    messages: Message[];
    currentUserId: number;
    channel: Channel;
    onScroll: (event: Event) => void;
    messageListRef: React.RefObject<HTMLDivElement>;
}

export interface MessageInputProps {
    onMessageSent?: (message: Message) => void,
    onSendMessage: (content: string, files?: File[]) => Promise<void>
    isSending: boolean;
}

/**
 * Other Props
*/

export interface EmptyStateProps {
    chats: Channel[];
    onSelectChat: (chat: Channel) => void;
    selectedChat: Channel | null;
}

export interface UserInfoProps {
    username: string;
    avatar: string;
    status?: string;
}

export interface SidebarProps {
    chats: Channel[];
    onSelectChat: (chat: Channel) => void;
    currentUser: number;
}