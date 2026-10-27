# Mailbox MCP

> ## 👋 A quick note
>
> I run **[Smart Home Newsletter](https://smarthomenewsletter.com/?utm_source=homeassistant&utm_medium=docs&utm_campaign=mailbox-mcp)** — a weekly curated digest for smart home enthusiasts.
>
> Each issue highlights the most relevant smart home **articles, news, and projects** from the past week.
>
> Since you're here, you run Home Assistant and like hooking AI assistants into it. That's exactly the kind of project the newsletter covers, so you might genuinely enjoy it.
>
> 👉 [Subscribe at smarthomenewsletter.com](https://smarthomenewsletter.com/?utm_source=homeassistant&utm_medium=docs&utm_campaign=mailbox-mcp)

---

Makes one IMAP mailbox available to AI assistants as a remote MCP server: search, read, organise and drafts, never sending. [jgalea/mailbox-mcp](https://github.com/jgalea/mailbox-mcp) does the email work and [supergateway](https://github.com/supercorp-ai/supergateway) serves it over Streamable HTTP on port 8080. The app has no login of its own: Cloudflare Access does that.

## Setup

### 1. Mailbox

Create an app password with **IMAP rights only**, so sending is impossible at the provider too. On mailbox.org: All settings > Security > Email app passwords. While you're there, turn off "Allow a password reset link to be sent to my email address (IMAP)": anyone who can read the mailbox could otherwise reset the account.

### 2. Options

| Option | Description |
|---|---|
| `account_alias` | The name the assistant uses for this mailbox |
| `email` | The address, also used as IMAP username |
| `imap_password` | The app password |
| `imap_host`, `imap_port` | Defaults to mailbox.org |
| `smtp_host`, `smtp_port` | Required by mailbox-mcp but never used |

Start the app. The log should end with `Listening on port 8080`.

### 3. Cloudflare tunnel

Hosted assistants such as claude.ai and ChatGPT connect from their provider's cloud, so the app needs a public HTTPS address. Add a public hostname to your tunnel pointing to `http://<hostname>:8080`, where `<hostname>` is the app's hostname from its info page (`<repository hash>-mailbox-mcp`). The app publishes no port on your network.

MCP clients are not browsers: make sure Bot Fight Mode and Browser Integrity Check don't apply to this hostname (a Configuration Rule can turn the latter off for one hostname), and bypass the cache for it.

### 4. Cloudflare Access

Never expose the hostname without this: the app trusts whoever reaches it.

1. Zero Trust > Access > Applications > Add a self-hosted application for the hostname, path `/mcp`.
2. Policy: allow only your own email address.
3. Advanced settings: turn on **Managed OAuth**. Access then acts as the OAuth server, including dynamic client registration.
4. Under dynamic client registration, allow localhost and loopback clients (desktop and command-line clients such as Claude Code). Hosted clients need their OAuth redirect URI in the allowed redirect URIs; for Claude that is `https://claude.ai/api/mcp/*` and `https://claude.com/api/mcp/*`, for others see their documentation. A missing one fails with `invalid_client_metadata: redirect_uri is not allowed by the account configuration`.

Access changes take a minute or two to propagate. A request to `/mcp` without a login should then return `401`.

### 5. Your assistant

Add a remote MCP server with the URL `https://<hostname>/mcp`, leave any OAuth client fields empty and log in through Access. In Claude: Settings > Connectors > Add custom connector.

## Data

Everything is stored in the app's `/data` folder and included in Home Assistant backups: the options (with the app password in plain text), a generated passphrase and the credentials encrypted with it.
