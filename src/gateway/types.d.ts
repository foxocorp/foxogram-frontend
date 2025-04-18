import { GatewayDispatchEvents } from "@foxogram/gateway-types";
import { APIChannel, APIMember, APIMessage } from "@foxogram/api-types";

export interface EventPayloadMap {
    [GatewayDispatchEvents.ChannelCreate]: APIChannel;
    [GatewayDispatchEvents.ChannelUpdate]: APIChannel;
    [GatewayDispatchEvents.ChannelDelete]: { id: number };
    [GatewayDispatchEvents.MemberAdd]: APIMember;
    [GatewayDispatchEvents.MemberRemove]: { user_id: number; channel_id: number };
    [GatewayDispatchEvents.MemberUpdate]: APIMember;

    [GatewayDispatchEvents.MessageCreate]: APIMessage;
    [GatewayDispatchEvents.MessageUpdate]: APIMessage;
    [GatewayDispatchEvents.MessageDelete]: { id: number };
}

export type EmitFunc = <T extends keyof EventPayloadMap>(
    event: T,
    data: EventPayloadMap[T]
) => void;

export type EventHandler<T extends keyof EventPayloadMap> = (
    data: EventPayloadMap[T],
    emit: EmitFunc
) => void;

export type EventHandlers = {
    [K in keyof EventPayloadMap]?: EventHandler<K>;
};
