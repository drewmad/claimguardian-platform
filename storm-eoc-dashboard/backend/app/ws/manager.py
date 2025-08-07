# backend/app/ws/manager.py
from fastapi import WebSocket
from typing import List
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    # Singleton pattern for global access to the manager
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ConnectionManager, cls).__new__(cls)
            cls._instance.active_connections = []
        return cls._instance

    def __init__(self):
        # active_connections initialized in __new__
        pass

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        """Broadcasts a message (JSON string) to all connected clients."""
        logger.info(f"Broadcasting message to {len(self.active_connections)} clients.")
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}. Disconnecting client.")
                self.disconnect(connection)

manager = ConnectionManager()
