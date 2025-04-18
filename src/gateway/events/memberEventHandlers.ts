import { GatewayDispatchEvents } from "@foxogram/gateway-types";
import { EventHandlers } from "../types";

export const memberEventHandlers: Pick<EventHandlers,
    GatewayDispatchEvents.MemberAdd |
    GatewayDispatchEvents.MemberRemove |
    GatewayDispatchEvents.MemberUpdate
> = {
    [GatewayDispatchEvents.MemberAdd]: (data, emit) => {
        emit(GatewayDispatchEvents.MemberAdd, data);
    },
    [GatewayDispatchEvents.MemberRemove]: (data, emit) => {
        emit(GatewayDispatchEvents.MemberRemove, data);
    },
    [GatewayDispatchEvents.MemberUpdate]: (data, emit) => {
        emit(GatewayDispatchEvents.MemberUpdate, data);
    },
};
