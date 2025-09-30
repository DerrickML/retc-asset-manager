/**
 * WebSocket Service for Real-time Dashboard Updates
 * Implements efficient real-time data synchronization with connection management
 */

class WebSocketManager {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.listeners = new Map();
    this.isConnected = false;
    this.pingInterval = null;
    this.pongTimeout = null;
    this.lastPingTime = null;

    // Bind methods to preserve context
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
  }

  /**
   * Establish WebSocket connection with auto-reconnect
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      return; // Already connecting
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      // Use secure WebSocket in production
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
      const wsUrl = `${protocol}//${host}/ws/dashboard`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = (event) => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        // Start ping/pong heartbeat
        this.startHeartbeat();

        // Notify listeners of connection
        this.emit("connection", { status: "connected" });

        // Subscribe to dashboard events
        this.subscribeToChannels();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          // Silent fail for message parsing
        }
      };

      this.ws.onerror = (error) => {
        this.emit("error", { error });
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        this.stopHeartbeat();

        // Notify listeners of disconnection
        this.emit("connection", {
          status: "disconnected",
          code: event.code,
          reason: event.reason,
        });

        // Attempt to reconnect if not a clean close
        if (
          event.code !== 1000 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.isConnected = false;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  /**
   * Send message to server
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Subscribe to events
   */
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType).add(callback);

    // Return unsubscribe function
    return () => this.unsubscribe(eventType, callback);
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);

      // Clean up empty event types
      if (this.listeners.get(eventType).size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      for (const callback of this.listeners.get(eventType)) {
        try {
          callback(data);
        } catch (error) {
          // Silent fail for event listener
        }
      }
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(data) {
    const { type, payload, timestamp } = data;

    // Handle heartbeat response
    if (type === "pong") {
      this.handlePong();
      return;
    }

    // Emit event to subscribers
    this.emit(type, { ...payload, timestamp });

    // Handle specific message types
    switch (type) {
      case "dashboard_update":
        this.handleDashboardUpdate(payload);
        break;
      case "asset_status_change":
        this.handleAssetStatusChange(payload);
        break;
      case "request_status_change":
        this.handleRequestStatusChange(payload);
        break;
      case "alert_new":
        this.handleNewAlert(payload);
        break;
      case "alert_resolved":
        this.handleAlertResolved(payload);
        break;
      default:
        // Generic event handling
        this.emit("message", data);
    }
  }

  /**
   * Handle dashboard metrics updates
   */
  handleDashboardUpdate(payload) {
    this.emit("dashboard_metrics_update", payload);
  }

  /**
   * Handle asset status changes
   */
  handleAssetStatusChange(payload) {
    this.emit("asset_update", payload);
  }

  /**
   * Handle request status changes
   */
  handleRequestStatusChange(payload) {
    this.emit("request_update", payload);
  }

  /**
   * Handle new alerts
   */
  handleNewAlert(payload) {
    this.emit("alert_created", payload);
  }

  /**
   * Handle resolved alerts
   */
  handleAlertResolved(payload) {
    this.emit("alert_resolved", payload);
  }

  /**
   * Subscribe to dashboard-specific channels
   */
  subscribeToChannels() {
    // Subscribe to dashboard updates
    this.send({
      type: "subscribe",
      channels: [
        "dashboard_metrics",
        "asset_changes",
        "request_changes",
        "alerts",
      ],
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing heartbeat

    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.lastPingTime = Date.now();
        this.send({ type: "ping", timestamp: this.lastPingTime });

        // Set timeout to detect connection loss
        this.pongTimeout = setTimeout(() => {
          this.ws?.close();
        }, 10000); // 10 second timeout
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  /**
   * Handle pong response
   */
  handlePong() {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }

    if (this.lastPingTime) {
      const latency = Date.now() - this.lastPingTime;
      this.emit("latency", { latency });
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit("connection", {
        status: "failed",
        attempts: this.reconnectAttempts,
      });
      return;
    }

    this.reconnectAttempts++;

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff with jitter
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2 + Math.random() * 1000,
      this.maxReconnectDelay
    );
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws?.readyState,
      url: this.ws?.url,
    };
  }
}

// Singleton instance
const websocketManager = new WebSocketManager();

// Dashboard-specific WebSocket service
export class DashboardWebSocketService {
  constructor() {
    this.manager = websocketManager;
    this.subscriptions = new Set();
  }

  /**
   * Initialize WebSocket connection for dashboard
   */
  connect() {
    this.manager.connect();
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    // Unsubscribe from all dashboard events
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }
    this.subscriptions.clear();

    this.manager.disconnect();
  }

  /**
   * Subscribe to dashboard metrics updates
   */
  onMetricsUpdate(callback) {
    const unsubscribe = this.manager.subscribe(
      "dashboard_metrics_update",
      callback
    );
    this.subscriptions.add(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to asset updates
   */
  onAssetUpdate(callback) {
    const unsubscribe = this.manager.subscribe("asset_update", callback);
    this.subscriptions.add(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to request updates
   */
  onRequestUpdate(callback) {
    const unsubscribe = this.manager.subscribe("request_update", callback);
    this.subscriptions.add(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to alert updates
   */
  onAlertUpdate(callback) {
    const unsubscribeCreate = this.manager.subscribe("alert_created", callback);
    const unsubscribeResolve = this.manager.subscribe(
      "alert_resolved",
      callback
    );

    this.subscriptions.add(unsubscribeCreate);
    this.subscriptions.add(unsubscribeResolve);

    return () => {
      unsubscribeCreate();
      unsubscribeResolve();
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(callback) {
    const unsubscribe = this.manager.subscribe("connection", callback);
    this.subscriptions.add(unsubscribe);
    return unsubscribe;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return this.manager.getStatus();
  }

  /**
   * Send custom message
   */
  send(message) {
    return this.manager.send(message);
  }
}

// Export singleton instance
export const dashboardWebSocket = new DashboardWebSocketService();

export default dashboardWebSocket;
