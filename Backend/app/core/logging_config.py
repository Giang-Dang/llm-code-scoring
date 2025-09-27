import logging
import logging.config
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path
import os
import json


def _resolve_logs_dir() -> Path:
    """Resolve the repository root `logs` directory.

    Assumes this file lives at `<repo>/app/core/logging_config.py`.
    """
    current = Path(__file__).resolve()
    repo_root = current.parents[2]
    logs_dir = repo_root / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    return logs_dir


def _get_log_level() -> str:
    level = os.environ.get("LOG_LEVEL", "INFO").upper()
    valid = {"CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"}
    return level if level in valid else "INFO"


def configure_logging() -> None:
    """Configure app-wide logging with rotating file handlers under root `logs/`.

    - App logs: logs/app.log (INFO+, daily rotation, 7 backups)
    - Error logs: logs/error.log (ERROR+, daily rotation, 14 backups)
    - Access logs: logs/access.log (INFO+, daily rotation, 7 backups)
    - Console logs: for local development visibility
    - Aligns uvicorn and httpx loggers
    """
    logs_dir = _resolve_logs_dir()
    app_log = str(logs_dir / "app.log")
    err_log = str(logs_dir / "error.log")
    access_log = str(logs_dir / "access.log")

    level = _get_log_level()

    # Load base config from JSON if present; fallback to built-in config
    # Prefer project root settings file; fallback to app/core if missing
    repo_root = Path(__file__).resolve().parents[2]
    settings_path = repo_root / "logging_settings.json"
    if not settings_path.exists():
        settings_path = Path(__file__).with_name("logging_settings.json")
    config = None
    if settings_path.exists():
        try:
            with open(settings_path, "r", encoding="utf-8") as f:
                config = json.load(f)
        except Exception:
            config = None

    if config is None:
        config = {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                    "datefmt": "%Y-%m-%d %H:%M:%S",
                },
                "access": {
                    "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                    "datefmt": "%Y-%m-%d %H:%M:%S",
                },
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "level": level,
                    "formatter": "default",
                },
                "file_app": {
                    "()": TimedRotatingFileHandler,
                    "level": level,
                    "formatter": "default",
                    "filename": app_log,
                    "when": "midnight",
                    "backupCount": 7,
                    "encoding": "utf-8",
                    "delay": True,
                },
                "file_error": {
                    "()": TimedRotatingFileHandler,
                    "level": "ERROR",
                    "formatter": "default",
                    "filename": err_log,
                    "when": "midnight",
                    "backupCount": 14,
                    "encoding": "utf-8",
                    "delay": True,
                },
                "file_access": {
                    "()": TimedRotatingFileHandler,
                    "level": "INFO",
                    "formatter": "access",
                    "filename": access_log,
                    "when": "midnight",
                    "backupCount": 7,
                    "encoding": "utf-8",
                    "delay": True,
                },
            },
            "root": {
                "level": level,
                "handlers": ["console", "file_app", "file_error"],
            },
            "loggers": {
                "uvicorn": {
                    "level": level,
                    "handlers": ["console", "file_app"],
                    "propagate": False,
                },
                "uvicorn.error": {
                    "level": level,
                    "handlers": ["console", "file_app", "file_error"],
                    "propagate": False,
                },
                "uvicorn.access": {
                    "level": "INFO",
                    "handlers": ["console", "file_access"],
                    "propagate": False,
                },
                "httpx": {
                    "level": "WARNING",
                    "handlers": ["console", "file_app"],
                    "propagate": False,
                },
                "asyncio": {
                    "level": "WARNING",
                    "handlers": ["console", "file_app"],
                    "propagate": False,
                },
            },
        }

    # Adapt handler filenames to absolute repo paths and apply env level overrides
    handlers = config.get("handlers", {})
    for name, handler in handlers.items():
        if not isinstance(handler, dict):
            continue
        if name == "console":
            handler["level"] = level
        if name == "file_app":
            handler["level"] = level
        if "filename" in handler and isinstance(handler["filename"], str):
            fn = handler["filename"]
            if fn.endswith("app.log"):
                handler["filename"] = app_log
            elif fn.endswith("error.log"):
                handler["filename"] = err_log
            elif fn.endswith("access.log"):
                handler["filename"] = access_log

    config.setdefault("root", {})
    config["root"]["level"] = level

    loggers = config.setdefault("loggers", {})
    for logger_name in ("uvicorn", "uvicorn.error"):
        logger_cfg = loggers.setdefault(logger_name, {})
        logger_cfg["level"] = level

    logging.config.dictConfig(config)

    logging.getLogger(__name__).info("Logging configured: level=%s, dir=%s", level, logs_dir)


