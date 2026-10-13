import time
from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseAgent(ABC):
    def __init__(self, agent_number: int, agent_name: str, agent_role: str):
        self.agent_number = agent_number
        self.agent_name = agent_name
        self.agent_role = agent_role
        self.logs: List[str] = []

    def log(self, message: str):
        timestamp = time.strftime("%H:%M:%S")
        self.logs.append(f"[{timestamp}] [{self.agent_name}] {message}")

    @abstractmethod
    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent logic against the pipeline context and return updated state."""
        pass
