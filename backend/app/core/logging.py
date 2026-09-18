import logging
import sys
import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from app.config.settings import settings


class StructuredFormatter(logging.Formatter):
    """
    Format logs as structured JSON in production, or clear colored logs in development.
    """
    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.fromtimestamp(record.created, timezone.utc).isoformat()
        log_obj = {
            "timestamp": timestamp,
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # Add custom attributes if present
        for attr in ["request_id", "user_id", "repository_name", "agent_name", "duration_ms"]:
            if hasattr(record, attr):
                log_obj[attr] = getattr(record, attr)
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        if settings.APP_ENV == "production":
            return json.dumps(log_obj)
        else:
            req_info = f" [{log_obj.get('request_id', '')}]" if "request_id" in log_obj else ""
            return f"[{timestamp}] {record.levelname:7s} {record.name}{req_info}: {record.getMessage()}"


def setup_logging():
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Avoid duplicate handlers
    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredFormatter())
        root_logger.addHandler(handler)
    else:
        for handler in root_logger.handlers:
            handler.setFormatter(StructuredFormatter())


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
