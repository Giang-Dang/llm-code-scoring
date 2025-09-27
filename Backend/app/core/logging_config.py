import logging
import logging.config
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path
import os
import json
from typing import Any, Dict, Optional


def get_repo_root() -> Path:
    """Return repository root assuming this file is at <repo>/app/core/logging_config.py."""
    return Path(__file__).resolve().parents[2]


def resolve_paths() -> Dict[str, Any]:
    """Return important paths (RORO): repo_root, logs_dir, app_log, err_log, access_log, settings_path."""
    repo_root = get_repo_root()
    logs_dir = repo_root / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)

    # Prefer project root settings; fallback to app/core
    root_settings = repo_root / "logging_settings.json"
    fallback_settings = Path(__file__).with_name("logging_settings.json")
    settings_path = root_settings if root_settings.exists() else fallback_settings

    return {
        "repo_root": repo_root,
        "logs_dir": logs_dir,
        "app_log": str(logs_dir / "app.log"),
        "err_log": str(logs_dir / "error.log"),
        "access_log": str(logs_dir / "access.log"),
        "settings_path": settings_path,
    }


def get_env_log_level() -> str:
    """Return normalized LOG_LEVEL from env or default to INFO."""
    level = os.environ.get("LOG_LEVEL", "INFO").upper()
    return level if level in {"CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"} else "INFO"


def read_json_file(path: Path) -> Optional[Dict[str, Any]]:
    if not path.exists():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def build_default_config(*, level: str, app_log: str, err_log: str, access_log: str) -> Dict[str, Any]:
    """Provide a sane default logging config if JSON is absent or invalid."""
    return {
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


def apply_overrides(
    *,
    config: Dict[str, Any],
    level: str,
    app_log: str,
    err_log: str,
    access_log: str,
) -> Dict[str, Any]:
    """Adapt handler filenames to absolute paths and align levels with env LOG_LEVEL."""
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

    return config


def configure_logging() -> None:
    """Configure logging for the application."""
    paths = resolve_paths()
    level = get_env_log_level()

    config = read_json_file(paths["settings_path"]) or build_default_config(
        level=level,
        app_log=paths["app_log"],
        err_log=paths["err_log"],
        access_log=paths["access_log"],
    )

    config = apply_overrides(
        config=config,
        level=level,
        app_log=paths["app_log"],
        err_log=paths["err_log"],
        access_log=paths["access_log"],
    )

    logging.config.dictConfig(config)
    logging.getLogger(__name__).info(
        "Logging configured: level=%s, dir=%s",
        level,
        str(paths["logs_dir"]),
    )


