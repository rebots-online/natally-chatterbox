# Open Design MCP configuration — 17 October 2026

Robin explicitly requested adding the supplied local server to global Codex MCP
configuration if absent, then using Open Design as the design lead rather than
Stitch. No Natally runtime model/provider change is authorized or made here.

## Completed configuration task

- `C:\Users\Admin\.codex\config.toml` had no `mcp_servers.open-design` entry.
- Applied the exact supplied command, arguments and five environment values.
  The supplied executable, daemon entrypoint and bootstrap executable exist.
- Preserved all other parsed TOML settings and server definitions; validated
  the resulting TOML. A private pre-change backup remains alongside the config.
- `codex mcp get open-design` reports enabled, stdio, and the supplied command.
- Actually launched that command hidden with the supplied environment and
  performed MCP initialize and tools/list, not just a configuration inspection.
  Server returned protocol 2025-06-18, Open Design version 0.2.0 and real tools.
- Direct MCP list_agents reports installed Codex CLI 0.162.1 and specifically
  exposes `gpt-6-astra`. This is one of Robin's requested design engines and is
  selected for the consultation. No substitution with a smaller engine.

Global configuration and its private backup are outside this repository and
are not published wholesale. This receipt is the Git-published task result.
The current chat's native tool inventory did not acquire the new namespace;
the verified stdio MCP connection can still perform the consultation in this
session. Configuration presence and actual generated design delivery are
separate evidence; no design result is claimed by this setup receipt.
