#!/usr/bin/env python3
"""Send a UTF-8 plain-text email through QQ SMTP.

This script is intentionally small and boring: automation should generate the
report, write UTF-8 subject/body files, then call this script to send them.
"""

from __future__ import annotations

import argparse
import json
import os
import smtplib
import ssl
import sys
from email.header import Header
from email.message import EmailMessage
from pathlib import Path


DEFAULT_RECIPIENT = "2291784327@qq.com"
DEFAULT_SMTP_HOST = "smtp.qq.com"
DEFAULT_SMTP_PORT = 465
USER_ENV = "QQ_MAIL_USER"
AUTH_ENV = "QQ_MAIL_AUTH_CODE"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def read_utf8_file(path: str, label: str) -> str:
    try:
        return Path(path).read_text(encoding="utf-8")
    except OSError as error:
        raise SystemExit(f"Could not read {label} file: {error}") from error
    except UnicodeDecodeError as error:
        raise SystemExit(f"{label} file must be UTF-8: {error}") from error


def nonempty(value: str, label: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise SystemExit(f"{label} must not be empty.")
    return normalized


def build_message(sender: str, recipient: str, subject: str, body: str) -> EmailMessage:
    message = EmailMessage()
    message["From"] = sender
    message["To"] = recipient
    message["Subject"] = str(Header(subject, "utf-8"))
    message.set_content(body, subtype="plain", charset="utf-8")
    return message


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Send a UTF-8 email through QQ SMTP.")
    parser.add_argument("--to", default=DEFAULT_RECIPIENT, help="Recipient email address.")
    parser.add_argument("--subject-file", required=True, help="UTF-8 file containing the subject.")
    parser.add_argument("--body-file", required=True, help="UTF-8 file containing the body.")
    parser.add_argument("--smtp-host", default=DEFAULT_SMTP_HOST, help="SMTP host.")
    parser.add_argument("--smtp-port", type=int, default=DEFAULT_SMTP_PORT, help="SMTP SSL port.")
    parser.add_argument("--dry-run", action="store_true", help="Validate inputs without sending.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    sender = os.environ.get(USER_ENV, "")
    auth_code = os.environ.get(AUTH_ENV, "")
    subject = nonempty(read_utf8_file(args.subject_file, "subject"), "Subject")
    body = nonempty(read_utf8_file(args.body_file, "body"), "Body")
    recipient = nonempty(args.to, "Recipient")

    if args.dry_run:
        print(json.dumps({
            "dryRun": True,
            "smtpHost": args.smtp_host,
            "smtpPort": args.smtp_port,
            "fromConfigured": bool(sender),
            "authConfigured": bool(auth_code),
            "to": recipient,
            "subject": subject,
            "bodyCharacters": len(body),
            "bodyBytesUtf8": len(body.encode("utf-8")),
        }, ensure_ascii=False))
        return 0

    sender = nonempty(sender, USER_ENV)
    auth_code = nonempty(auth_code, AUTH_ENV)
    message = build_message(sender, recipient, subject, body)

    try:
        with smtplib.SMTP_SSL(
            args.smtp_host,
            args.smtp_port,
            timeout=30,
            context=ssl.create_default_context(),
        ) as smtp:
            smtp.login(sender, auth_code)
            smtp.send_message(message)
    except Exception as error:
        raise SystemExit(f"Failed to send QQ mail through {args.smtp_host}:{args.smtp_port}: {error}") from error

    print(json.dumps({
        "sent": True,
        "smtpHost": args.smtp_host,
        "smtpPort": args.smtp_port,
        "to": recipient,
        "subject": subject,
        "bodyCharacters": len(body),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
