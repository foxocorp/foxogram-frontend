import { GatewayDispatchEvents } from "@foxogram/gateway-types";
import { EventHandlers } from "../types";

export const channelEventHandlers: Pick<EventHandlers,
    GatewayDispatchEvents.ChannelCreate |
    GatewayDispatchEvents.ChannelUpdate |
    GatewayDispatchEvents.ChannelDelete
> = {
    [GatewayDispatchEvents.ChannelCreate]: (data, emit) => {
        emit(GatewayDispatchEvents.ChannelCreate, data);
    },
    [GatewayDispatchEvents.ChannelUpdate]: (data, emit) => {
        emit(GatewayDispatchEvents.ChannelUpdate, data);
    },
    [GatewayDispatchEvents.ChannelDelete]: (data, emit) => {
        emit(GatewayDispatchEvents.ChannelDelete, data);
    },
};
