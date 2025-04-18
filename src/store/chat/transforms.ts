import {
    APIUser,
    APIChannel,
    APIMember,
    APIMessage,
    ChannelType,
    UserFlags,
    UserType,
    MemberPermissions,
} from "@foxogram/api-types";
import { Channel, Member, Message, User, Attachment } from "@interfaces/interfaces";
import { fallbackMember } from "./constants";

export function normalizePermissions(permissions: string | number): number {
    if (typeof permissions === "string") {
        return parseInt(permissions, 10) || MemberPermissions.SendMessages;
    }
    return permissions;
}

export function normalizeChannelType(
    type: string | ChannelType | undefined
): ChannelType {
    if (typeof type === "string") {
        const channelType = ChannelType[type as keyof typeof ChannelType];
        return channelType ?? ChannelType.DM;
    }
    return type ?? ChannelType.DM;
}

export function transformApiUserToUser(apiUser?: APIUser): User {
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
}

export function transformApiChannel(apiChannel?: APIChannel): Channel {
    if (!apiChannel) {
        return new Channel({
            id: 0,
            name: "deleted-channel",
            display_name: "Deleted Channel",
            icon: "",
            type: ChannelType.DM,
            member_count: 0,
            owner: transformApiUserToUser(),
            created_at: Date.now(),
            last_message: null,
        });
    }
    return new Channel({
        id: apiChannel.id || 0,
        name: apiChannel.name || "unnamed-channel",
        display_name:
            apiChannel.display_name || apiChannel.name || "Unnamed Channel",
        icon: apiChannel.icon || "",
        type: normalizeChannelType(apiChannel.type),
        member_count: apiChannel.member_count || 0,
        owner: transformApiUserToUser(apiChannel.owner),
        created_at: apiChannel.created_at || Date.now(),
        last_message: apiChannel.last_message
            ? transformToMessage(apiChannel.last_message)
            : null,
    });
}

export function transformApiMember(apiMember: APIMember): Member {
    return new Member({
        ...apiMember,
        user: transformApiUserToUser(apiMember.user),
        channel: transformApiChannel(apiMember.channel),
        permissions: normalizePermissions(apiMember.permissions),
    });
}

export function transformToMessage(data: APIMessage): Message {
    const author: APIMember = data.author || fallbackMember;
    const attachments: Attachment[] = (data.attachments || []).map((att) => ({
        id: att.id,
        content_type: att.content_type,
        filename: att.filename,
        flags: att.flags,
    }));
    return new Message({
        ...data,
        attachments,
        author: transformApiMember(author),
        channel: transformApiChannel(data.channel),
    });
}

export function createChannelFromAPI(c: APIChannel): Channel | null {
    try {
        return new Channel({
            id: c.id || 0,
            name: c.name || "unnamed-channel",
            display_name: c.display_name || c.name || "Unnamed Channel",
            icon: c.icon || "",
            type: normalizeChannelType(c.type),
            member_count: c.member_count || 0,
            owner: transformApiUserToUser(c.owner),
            created_at: c.created_at || Date.now(),
            lastMessage: c.last_message
                ? new Message(transformToMessage(c.last_message))
                : null,
        });
    } catch (e) {
        console.error("createChannelFromAPI error:", e);
        return null;
    }
}
