import {
    APIMember,
    UserFlags,
    UserType,
    ChannelType,
    MemberPermissions,
} from "@foxogram/api-types";

export const fallbackMember: APIMember = {
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
