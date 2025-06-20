import {
	APIChannel,
	APIMember,
	APIMessage,
	APIUser,
	APIAttachment,
	ChannelType,
	MemberPermissions,
	UserFlags,
	UserType,
	ChannelFlags,
} from "foxochat.js";

const FALLBACK_USER: APIUser = {
	id: 0,
	display_name: "",
	channels: [],
	avatar: {} as unknown as APIAttachment,
	username: "unknown",
	email: "",
	flags: UserFlags.Disabled,
	type: UserType.User,
	created_at: 0,
	status: 1,
	status_updated_at: 0,
};

const FALLBACK_CHANNEL: APIChannel = {
	id: 0,
	name: "",
	display_name: "",
	icon: {} as unknown as APIAttachment,
	type: ChannelType.DM,
	member_count: 0,
	owner: FALLBACK_USER,
	created_at: 0,
	flags: 0 as ChannelFlags,
};

export function normalizePermissions(permissions: string | number): number {
	if (typeof permissions === "string") {
		const n = parseInt(permissions, 10);
		return isNaN(n) ? MemberPermissions.SendMessages : n;
	}
	return permissions;
}

export function normalizeChannelType(type?: string | number): ChannelType {
	const num = typeof type === "string" ? parseInt(type, 10) : type;

	if (typeof num === "number" && num in ChannelType) {
		return num as ChannelType;
	}

	return ChannelType.DM;
}

export function transformApiUserToUser(u: APIUser | undefined): APIUser {
	return { ...FALLBACK_USER, ...(u ?? {}) };
}

export function transformApiMember(raw: APIMember | undefined): APIMember {
	if (!raw || typeof raw !== "object") {
		return {
			id: 0,
			user: FALLBACK_USER,
			channel: FALLBACK_CHANNEL,
			permissions: MemberPermissions.SendMessages,
			joined_at: 0,
		};
	}

	const ch = typeof raw.channel === "object" ? raw.channel : undefined;
	const safeChannel: APIChannel = {
		...FALLBACK_CHANNEL,
		...(ch ?? {}),
		type: normalizeChannelType(ch?.type),
		owner: transformApiUserToUser(ch?.owner),
		icon: typeof ch?.icon === "string" ? undefined : (ch?.icon as any),
	};

	return {
		id: raw.id,
		user: transformApiUserToUser(raw.user),
		channel: safeChannel,
		permissions: normalizePermissions(raw.permissions),
		joined_at: raw.joined_at,
	};
}

export function transformToMessage(raw: unknown): APIMessage {
	if (!raw || typeof raw !== "object") {
		return {
			id: 0,
			content: "",
			attachments: [],
			author: transformApiMember(undefined),
			channel: FALLBACK_CHANNEL,
			created_at: 0,
		};
	}

	const message = raw as Record<string, any>;

	let ch: any = undefined;
	if (typeof message.channel === "object") {
		ch = message.channel;
	} else if ("channel_id" in message || "channelId" in message) {
		const cid = Number(message.channel_id ?? message.channelId);
		if (!isNaN(cid)) {
			ch = { id: cid };
		}
	}

	const safeChannel: APIChannel = {
		...FALLBACK_CHANNEL,
		...(ch ?? {}),
		type: normalizeChannelType(ch?.type),
		owner: transformApiUserToUser(ch?.owner),
		icon: typeof ch?.icon === "string" ? undefined : (ch?.icon as any),
	};

	return {
		id: message.id ?? 0,
		content: message.content ?? "",
		attachments: message.attachments ?? [],
		author: transformApiMember(message.author),
		channel: safeChannel,
		created_at:
			message.created_at ?? message.createdAt ?? message.timestamp ?? Date.now(),
	};
}

export function createChannelFromAPI(c: APIChannel): APIChannel | null {
	try {
		const channel: APIChannel = {
			id: c.id,
			name: c.name,
			display_name: c.display_name,
			icon: typeof c.icon === "string" ? undefined : (c.icon as any),
			type: normalizeChannelType(c.type),
			member_count: c.member_count,
			owner: transformApiUserToUser(c.owner),
			created_at: c.created_at,
			flags: (c.flags ?? 0) as ChannelFlags,
		};

		if (c.last_message) {
			channel.last_message = transformToMessage(c.last_message);
		}

		return channel;
	} catch (e) {
		console.error("createChannelFromAPI error:", e);
		return null;
	}
}
