import { WebSocketClient } from "./webSocketClient";
import { GatewayCloseCodes } from "@foxogram/gateway-types";

export const initWebSocket = (
    token: string | null,
    onUnauthorized?: () => void,
): WebSocketClient => {
    const gatewayUrl = import.meta.env.PROD
        ? "wss://gateway.foxogram.su"
        : "wss://gateway.dev.foxogram.su";

    return new WebSocketClient( () => token, gatewayUrl, (event: CloseEvent) => {
        if (event.code === Number(GatewayCloseCodes.Unauthorized)) {
            onUnauthorized?.();
        }}, onUnauthorized,
    );
<<<<<<< HEAD
};
=======
};
>>>>>>> eec53638717d97f0b9ec2a017f2129589cdcd0e9
