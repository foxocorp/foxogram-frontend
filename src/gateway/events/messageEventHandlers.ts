import { GatewayDispatchEvents } from "@foxogram/gateway-types";
import { APIMessage } from "@foxogram/api-types";
import { EventHandlers, EmitFunc } from "../types";

export const messageEventHandlers: EventHandlers = {
    [GatewayDispatchEvents.MessageCreate]: (data: APIMessage, emit: EmitFunc) => {
        emit(GatewayDispatchEvents.MessageCreate, data);
    },
    [GatewayDispatchEvents.MessageUpdate]: (data: APIMessage, emit: EmitFunc) => {
        emit(GatewayDispatchEvents.MessageUpdate, data);
    },
    [GatewayDispatchEvents.MessageDelete]: (data: { id: number }, emit: EmitFunc) => {
        emit(GatewayDispatchEvents.MessageDelete, data);
    },
};
