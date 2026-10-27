FROM node:22-alpine

ARG BUILD_ARCH
ARG BUILD_VERSION
LABEL \
    io.hass.version="${BUILD_VERSION}" \
    io.hass.type="addon" \
    io.hass.arch="${BUILD_ARCH}"

# renovate: datasource=npm depName=mailbox-mcp
ARG MAILBOX_MCP_VERSION=0.13.1
# renovate: datasource=npm depName=supergateway
ARG SUPERGATEWAY_VERSION=4.2.1

RUN apk add --no-cache su-exec

# Both are pure JS; no install scripts needed.
RUN npm install --global --omit=dev --ignore-scripts \
        "mailbox-mcp@${MAILBOX_MCP_VERSION}" \
        "supergateway@${SUPERGATEWAY_VERSION}" \
    && npm cache clean --force

COPY setup.mjs run.sh /app/
RUN chmod 755 /app/run.sh

CMD ["/app/run.sh"]
