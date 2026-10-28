// Runs as root before the server starts. Turns /data/options.json into the
// files mailbox-mcp expects, and sets ownership so the server (running as
// node) can read its config but never write accounts.json.
//
// Why that matters: mailbox-mcp's `authenticate` tool (always on, it sits in
// the core group) lets the model add an account. A prompt-injected session
// could add an IMAP account on an attacker's server and drop mail there as
// drafts. With accounts.json owned by root, that save fails with EACCES and
// the new account never gets credentials.
import { randomBytes } from "node:crypto";
import { chmodSync, chownSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { encryptCredentials } from "/usr/local/lib/node_modules/mailbox-mcp/dist/auth/imap-auth.js";

const NODE_UID = 1000;
const NODE_GID = 1000;
const CONFIG_DIR = "/data/mailbox";
const LOG_DIR = "/data/mailbox-logs";
const PROXY_DIR = "/data/proxy";
const PASSPHRASE_FILE = "/data/passphrase";

const options = JSON.parse(readFileSync("/data/options.json", "utf8"));

for (const key of ["email", "imap_password"]) {
  if (!options[key]) {
    console.error(`Option "${key}" is empty; set it in the add-on configuration.`);
    process.exit(1);
  }
}

// The passphrase only encrypts credentials.json at rest; the password itself
// also sits in options.json. Generated once, kept across restarts.
if (!existsSync(PASSPHRASE_FILE)) {
  writeFileSync(PASSPHRASE_FILE, randomBytes(32).toString("base64"), { mode: 0o600 });
}
const passphrase = readFileSync(PASSPHRASE_FILE, "utf8").trim();

for (const dir of [CONFIG_DIR, LOG_DIR, PROXY_DIR]) {
  mkdirSync(dir, { recursive: true });
  chownSync(dir, NODE_UID, NODE_GID);
  chmodSync(dir, 0o700);
}

const alias = options.account_alias;
const accounts = {
  accounts: {
    [alias]: {
      provider: "imap",
      email: options.email,
      host: options.imap_host,
      port: options.imap_port,
      smtpHost: options.smtp_host,
      smtpPort: options.smtp_port,
      // Send tools create a draft instead, and nothing may be sent at all.
      draftsOnly: true,
      dailySendLimit: 0,
    },
  },
};
const accountsPath = join(CONFIG_DIR, "accounts.json");
writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
chownSync(accountsPath, 0, 0);
chmodSync(accountsPath, 0o644);

// Rewritten every start, so a changed password in the options takes effect.
encryptCredentials(CONFIG_DIR, alias, { username: options.username || options.email, password: options.imap_password }, passphrase);
const accountDir = join(CONFIG_DIR, "accounts", alias);
chownSync(join(CONFIG_DIR, "accounts"), NODE_UID, NODE_GID);
chownSync(accountDir, NODE_UID, NODE_GID);
chownSync(join(accountDir, "credentials.json"), NODE_UID, NODE_GID);

console.log(`Account "${alias}" (${options.email}) configured: drafts only, no sending.`);
