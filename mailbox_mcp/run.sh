#!/bin/sh
# Writes the mailbox-mcp config as root, then runs supergateway (which
# spawns mailbox-mcp over stdio and serves it as Streamable HTTP) as the
# unprivileged node user. Login is Cloudflare Access in front of the tunnel.
set -eu

node /app/setup.mjs

export MAILBOX_MCP_PASSPHRASE="$(cat /data/passphrase)"
export MAILBOX_MCP_CONFIG_DIR=/data/mailbox
export MAILBOX_MCP_LOG_DIR=/data/mailbox-logs
# draft: every tool that can make mail leave the account is hidden.
# No attachments or gmail-extras groups: nothing gets written to disk here.
export MAILBOX_MCP_PROFILE=draft
export MAILBOX_MCP_TOOLS=core,organize,bulk

echo "Starting on port 8080; only errors are logged from here on."
# supergateway logs every MCP message (mail content included) at info level,
# which goes to stdout; errors, including mailbox-mcp's own stderr, go to
# stderr. It has no level in between, so drop stdout and keep stderr.
exec su-exec node:node supergateway \
    --stdio mailbox-mcp \
    --outputTransport streamableHttp \
    --stateful \
    --sessionTimeout 3600000 \
    --port 8080 \
    --healthEndpoint /healthz \
    > /dev/null
