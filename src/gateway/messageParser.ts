import { GatewayOpcodes } from "@foxogram/gateway-types";

export interface GatewayMessage {
    op: GatewayOpcodes;
    d?: unknown;
    s?: number;
    t?: string;
}

export const parseMessage = (data: string): GatewayMessage => {
    try {
        const parsed: unknown = JSON.parse(data);
        if (isGatewayMessage(parsed)) {
            return parsed;
        }
        throw new Error("Invalid message structure");
    } catch {
        throw new Error("Malformed JSON received");
    }
};

const isGatewayMessage = (msg: unknown): msg is GatewayMessage =>
    typeof msg === "object" && msg !== null && "op" in msg && Object.values(GatewayOpcodes).includes(Number((msg as GatewayMessage).op));

export { isGatewayMessage };