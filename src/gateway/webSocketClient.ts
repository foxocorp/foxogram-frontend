import {
    GatewayOpcodes,
    GatewayDispatchEvents,
    GatewayCloseCodes,
} from "@foxogram/gateway-types";
import { Logger } from "@utils/logger";
import { APIChannel, APIMember, APIMessage } from "@foxogram/api-types";
import { connectionManager } from "./connectionManager";
import { parseMessage, GatewayMessage } from "./messageParser";
import { allHandlers, dispatchEvent } from "./dispatcher";
import { EventHandlers, EventPayloadMap } from "./types";

export interface EventMap {
    [GatewayDispatchEvents.MessageCreate]: APIMessage;
    [GatewayDispatchEvents.MessageUpdate]: APIMessage;
    [GatewayDispatchEvents.MessageDelete]: { id: number };
    [GatewayDispatchEvents.ChannelCreate]: APIChannel;
    [GatewayDispatchEvents.ChannelUpdate]: APIChannel;
    [GatewayDispatchEvents.ChannelDelete]: { id: number };
    [GatewayDispatchEvents.MemberAdd]: APIMember;
    [GatewayDispatchEvents.MemberRemove]: { user_id: number; channel_id: number };
    [GatewayDispatchEvents.MemberUpdate]: APIMember;
    connected: undefined;
    close: CloseEvent;
    error: Event;
}

type EventListener<T> = (_data: T) => void;

export class WebSocketClient {
    private socket: WebSocket | null = null;
    private readonly getToken: () => string | null;
    private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
    private heartbeatInterval = 0;
    private heartbeatAckReceived = true;
    private reconnectAttempts = 0;
    private reconnectDelay = 1000;
    private readonly maxReconnectAttempts = 3;
    private isExplicitClose = false;
    public isConnected = false;
    private eventListeners: Partial<{ [K in keyof EventMap]: EventListener<EventMap[K]>[] }> = {};
    private readonly gatewayUrl: string;
    private readonly onClose: ((_evt: CloseEvent) => void) | undefined;
    private readonly onUnauthorized: (() => void) | undefined;

    constructor(
        getToken: () => string | null,
        gatewayUrl: string,
        onClose?: (_evt: CloseEvent) => void,
        onUnauthorized?: () => void,
    ) {
        this.getToken = getToken;
        this.gatewayUrl = gatewayUrl;
        this.onClose = onClose;
        this.onUnauthorized = onUnauthorized;
    }

    public connect(): void {
        if (this.isExplicitClose) return;
        if (!this.getToken()) {
            Logger.error("Cannot connect: No authentication token");
            this.onUnauthorized?.();
            return;
        }
        try {
            if (this.socket) {
                this.socket.close();
                this.socket = null;
            }
            this.socket = new WebSocket(this.gatewayUrl);
            const connectTimeout = setTimeout(() => {
                if (this.socket?.readyState !== WebSocket.OPEN) {
                    Logger.error("Connection timeout");
                    this.socket?.close();
                }
            }, 5000);
            this.socket.onopen = () => {
                clearTimeout(connectTimeout);
                this.handleOpen();
            };
            this.setupWebSocketHandlers();
        } catch (error) {
            Logger.error(`WebSocket connection error: ${error}`);
            this.scheduleReconnect();
        }
    }

    private setupWebSocketHandlers(): void {
        if (!this.socket) return;
        this.socket.onmessage = (e: MessageEvent) => {
            this.handleMessage(e);
        };
        this.socket.onclose = (e: CloseEvent) => {
            this.handleClose(e);
        };
        this.socket.onerror = (e: Event) => {
            Logger.error(`WebSocket error: ${JSON.stringify(e)}`);
            this.handleError(e);
        };
    }

    private handleOpen = (): void => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        Logger.debug("WebSocket connection established");
        this.sendIdentify();
        this.emit("connected", undefined);
    };

    private sendIdentify(): void {
        const token = this.getToken();
        if (!token) {
            Logger.error("No token available for identification");
            this.socket?.close();
            return;
        }
        const payload = {
            token,
            intents: (1 << 0) | (1 << 1) | (1 << 2),
        };
        this.send({ op: GatewayOpcodes.Identify, d: payload });
    }

    private handleMessage = ({ data }: MessageEvent): void => {
        if (typeof data !== "string") {
            Logger.warn("Received non-text message");
            return;
        }
        try {
            const message = parseMessage(data);
            this.processGatewayMessage(message);
        } catch (error) {
            Logger.error(`Message handling failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    private processGatewayMessage(message: GatewayMessage): void {
        switch (message.op) {
            case GatewayOpcodes.Dispatch:
                if (message.t) {
                    const handler = allHandlers[message.t as keyof EventHandlers];

                    if (handler) {
                        dispatchEvent(
                            message.t as keyof EventPayloadMap,
                            message.d as EventPayloadMap[keyof EventPayloadMap],
                            (_evt, payload) => {
                                this.emit(_evt as keyof EventMap, payload);
                            },
                        );
                    } else {
                        Logger.warn(`Unhandled dispatch type: ${message.t}`);
                    }
                } else {
                    Logger.warn("Received dispatch without event type");
                }
                break;
            case GatewayOpcodes.Hello:
                this.handleHello(message.d as { heartbeat_interval: number });
                break;
            case GatewayOpcodes.HeartbeatAck:
                this.handleHeartbeatAck();
                break;
            case GatewayOpcodes.Heartbeat:
                this.handleServerHeartbeat();
                break;
            default:
                Logger.warn(`Unhandled opcode: ${GatewayOpcodes[message.op] || message.op}`);
        }
    }


    private handleHello(data: { heartbeat_interval: number }): void {
        Logger.debug("Received Hello, starting heartbeat...");
        this.startHeartbeat(data.heartbeat_interval);
    }

    private startHeartbeat(interval: number): void {
        this.heartbeatInterval = interval;
        this.sendHeartbeat();
        this.heartbeatIntervalId = connectionManager.startHeartbeat(
            interval,
            this.sendHeartbeat.bind(this),
            () => {
                if (!this.heartbeatAckReceived) {
                    Logger.warn("Missed heartbeat ACK, reconnecting...");
                    this.reconnect();
                }
                this.heartbeatAckReceived = false;
            },
        );
    }

    private handleHeartbeatAck(): void {
        this.heartbeatAckReceived = true;
        Logger.debug("Heartbeat acknowledged");
        setTimeout(() => {
            connectionManager.checkConnectionHealth(
                this.isConnected,
                this.heartbeatAckReceived,
                this.reconnect.bind(this),
                this.heartbeatInterval * 0.9,
            );
        }, this.heartbeatInterval * 0.9);
    }

    private handleServerHeartbeat(): void {
        Logger.debug("Server requested heartbeat");
        this.sendHeartbeat();
    }

    private sendHeartbeat(): void {
        this.send({ op: GatewayOpcodes.Heartbeat, d: null });
    }

    private handleClose = (event: CloseEvent): void => {
        Logger.error(`Connection closed: ${event.code} (${event.reason})`);
        this.isConnected = false;
        connectionManager.cleanupHeartbeat(this.heartbeatIntervalId);
        this.onClose?.(event);
        if (event.code === (GatewayCloseCodes.Unauthorized as unknown as number)) {
            this.onUnauthorized?.();
            return;
        }
        if (!event.wasClean) {
            this.scheduleReconnect();
        }
    };

    private handleError(e: Event): void {
        Logger.error("WebSocket connection error");
        this.emit("error", e);
        this.scheduleReconnect();
    }

    private scheduleReconnect(): void {
        const timeoutId = connectionManager.scheduleReconnect(
            this.isExplicitClose,
            this.reconnectAttempts,
            this.maxReconnectAttempts,
            this.reconnectDelay,
            this.reconnect.bind(this),
        );
        if (timeoutId) {
            this.reconnectAttempts++;
            this.reconnectDelay *= 2;
        }
    }

    public reconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            Logger.error("Max reconnect attempts reached");
            this.onUnauthorized?.();
            return;
        }
        Logger.debug(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.heartbeatAckReceived = true;
        this.connect();
    }

    private send(message: GatewayMessage): void {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }

    private emit<T extends keyof EventMap>(event: T, data: EventMap[T]): void {
        if (!this.eventListeners[event]) return;
        (this.eventListeners[event]).forEach(listener => {
            listener(data);
        });
    }

    public on<T extends keyof EventMap>(event: T, listener: EventListener<EventMap[T]>): void {
        if (!this.eventListeners[event]) {
            (this.eventListeners as Record<T, EventListener<EventMap[T]>[]>)[event] = [];
        }
        (this.eventListeners as Record<T, EventListener<EventMap[T]>[]>)[event].push(listener);
    }

    public off<T extends keyof EventMap>(event: T, listener: EventListener<EventMap[T]>): void {
        if (this.eventListeners[event]) {
            (this.eventListeners as Record<T, EventListener<EventMap[T]>[]>)[event] =
                (this.eventListeners as Record<T, EventListener<EventMap[T]>[]>)[event].filter(l => l !== listener);
        }
    }

    public getConnectionState(): number | undefined {
        return this.socket?.readyState;
    }

    public close(): void {
        this.isExplicitClose = true;
        this.reconnectDelay = 1000;
        Logger.info("Closing WebSocket connection...");
        this.reconnectAttempts = 0;
        this.isConnected = false;
        this.socket?.close(1000, "Client initiated closure");
        connectionManager.cleanupHeartbeat(this.heartbeatIntervalId);
    }
}
