import { API } from "@foxogram/api";
import { REST } from "@foxogram/rest";
import { ChannelType, MemberKey } from "@foxogram/api-types";

const apiUrl = import.meta.env.PROD
    ? "https://api.foxogram.su"
    : "https://api.dev.foxogram.su";

export const getAuthToken = (): string | null => localStorage.getItem("authToken");
export const removeAuthToken = (): void => { localStorage.removeItem("authToken"); };
const setAuthToken = (token: string) => { localStorage.setItem("authToken", token);};

const defaultOptions = {
    baseURL: apiUrl,
};

const rest = new REST(defaultOptions);
const token = getAuthToken();
if (token) {
    rest.setToken(token);
}

const foxogramAPI = new API(rest);

export const apiMethods = {
    login: async (email: string, password: string) => {
        const token = await foxogramAPI.auth.login({ email, password });
        setAuthToken(token.access_token);
        rest.setToken(token.access_token);
        return token;
    },

    register: async (username: string, email: string, password: string) => {
        const token = await foxogramAPI.auth.register({ username, email, password });
        setAuthToken(token.access_token);
        rest.setToken(token.access_token);
        return token;
    },

    resendEmailVerification: () => foxogramAPI.auth.resendEmail(),
    resetPassword: (email: string) => foxogramAPI.auth.resetPassword({ email }),
    confirmResetPassword: (email: string, code: string, new_password: string) => foxogramAPI.auth.resetPasswordConfirm({ email, code, new_password }),
    verifyEmail: (code: string) => foxogramAPI.auth.verifyEmail({ code }),

    getCurrentUser: async () => {
        const token = getAuthToken();
        if (!token) {
            throw new Error("Authorization required");
        }

        try {
            return await foxogramAPI.user.current();
        } catch (error) {
            if ((error as any)?.status === 401) {
                removeAuthToken();
                throw error;
            }
            throw error;
        }
    },
    editUser: (body: { name: string; email: string }) => foxogramAPI.user.edit(body),
    deleteUser: async (body: { password: string }) => {
        await foxogramAPI.user.delete(body);
        removeAuthToken();
    },
    confirmDeleteUser: (body: { password: string; code: string }) => foxogramAPI.user.confirmDelete(body),
    userChannelsList: () => foxogramAPI.user.channels(),

    createChannel: (body: { display_name: string; name: string; type: ChannelType }) => foxogramAPI.channel.create(body),
    deleteChannel: (channelId: number) => foxogramAPI.channel.delete(channelId),
    editChannel: (channelId: number, body: { name?: string }) => foxogramAPI.channel.edit(channelId, body),
    getChannel: (channelId: number) => foxogramAPI.channel.get(channelId),
    joinChannel: (channelId: number) => foxogramAPI.channel.join(channelId),
    leaveChannel: (channelId: number) => foxogramAPI.channel.leave(channelId),
    getChannelMember: (channelId: number, memberKey: MemberKey) =>foxogramAPI.channel.member(channelId, memberKey),
    listChannelMembers: (channelId: number) => foxogramAPI.channel.members(channelId),

    membersList: (channelId: number) => foxogramAPI.channel.members(channelId),
    createMessage: (channelId: number, body: { content: string; attachments: Uint8Array[] }) => foxogramAPI.message.create(channelId, body),
    deleteMessage: (channelId: number, messageId: number) => foxogramAPI.message.delete(channelId, messageId),
    editMessage: (channelId: number, messageId: number, content: string, attachments: Uint8Array[]) => foxogramAPI.message.edit(channelId, messageId, { content, attachments }),
    getMessage: (channelId: number, messageId: number) => foxogramAPI.message.get(channelId, messageId),
    listMessages: (channelId: number, query?: { before?: number; limit?: number }) => foxogramAPI.message.list(channelId, query),
};