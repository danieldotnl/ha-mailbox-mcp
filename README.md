# Mailbox MCP for Home Assistant

---

> [!TIP]
>
> ## 👋 A quick note
>
> I run **[Smart Home Newsletter](https://smarthomenewsletter.com/?utm_source=github&utm_medium=readme&utm_campaign=mailbox-mcp)** — a weekly curated digest for smart home enthusiasts.
>
> Each issue highlights the most relevant smart home **articles, news, and projects** from the past week.
>
> Since you're here, you run Home Assistant and like hooking AI assistants into it. That's exactly the kind of project the newsletter covers, so you might genuinely enjoy it.
>
> 👉 [Subscribe at smarthomenewsletter.com](https://smarthomenewsletter.com/?utm_source=github&utm_medium=readme&utm_campaign=mailbox-mcp)

---

A Home Assistant app (add-on) that makes an IMAP mailbox available as a remote MCP server, so AI assistants that support remote MCP servers (such as Claude, ChatGPT or Cursor) can work with it. Access is limited to reading, organising and drafts. The login is Cloudflare Access with Managed OAuth, in front of a Cloudflare tunnel.

It packages two existing projects; the real work is theirs:

- **[jgalea/mailbox-mcp](https://github.com/jgalea/mailbox-mcp)** is the MCP server. It was chosen for how it handles mail written by strangers: content reaches the model fenced as untrusted data, hidden HTML text and invisible characters are stripped, and sending can be switched off in ways the model cannot undo.
- **[supercorp-ai/supergateway](https://github.com/supercorp-ai/supergateway)** serves that stdio server as Streamable HTTP, which remote MCP clients need.

This repository only adds the Home Assistant packaging and a locked-down configuration.

## What the assistant can and cannot do

- **Can:** search, read, inbox summaries, create and update drafts, labels and flags, archive, trash, bulk changes with undo.
- **Cannot:** send, reply, forward, or set filters, signatures or auto-replies. The server runs with `MAILBOX_MCP_PROFILE=draft` and the account with `draftsOnly` and a daily send limit of 0. Downloading attachments to disk is off.
- **Cannot add accounts.** mailbox-mcp's `authenticate` tool is always available, so a prompt-injected session could try to add an account on a server it controls and leave copies of your mail there as drafts. Here `accounts.json` is owned by root and the server runs as an unprivileged user, so that save fails and the new account never gets credentials.
- Use an app password that only has **IMAP** rights. Then sending is impossible at the provider as well.

None of this makes prompt injection impossible: a mail can still try to steer what the assistant does with its other tools. Mail content is fenced and cleaned, but keep that in mind.

## Installation

In Home Assistant, go to **Settings > Apps > App store**, open the menu, choose **Repositories** and add `https://github.com/danieldotnl/ha-mailbox-mcp`. Then install **Mailbox MCP** and follow the setup on its Documentation tab ([DOCS.md](mailbox_mcp/DOCS.md)).

## Updates

The versions of mailbox-mcp, supergateway and the Node base image are pinned in the [Dockerfile](mailbox_mcp/Dockerfile). Renovate proposes updates after a 10-day wait and raises the app version with them, so Home Assistant offers the update. mailbox-mcp is young and moves fast: read its changelog before merging.

## License

MIT for this packaging. mailbox-mcp and supergateway are MIT licensed by their own authors.
