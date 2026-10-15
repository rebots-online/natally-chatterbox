# Natally chart presentation — 15 October 2026

Production: https://natally.surge.sh

Surge release: `1792070740988`.
Built source: `3269589c806c24494e9354acbdfef44b5eb9cec3`.

The top-level `index.html`, `assets/`, `fonts/`, `tests/`, `vendor/` and mascot
are the exact 22-file site payload fetched from the deployment checkout and
verified against live production. Use the stamped ZIP to reproduce that payload;
the adjacent manifest records its SHA-256 and each deployed file's hash.

`verification/` contains the local chart interaction evidence and live asset/login
verification. Local interactions use real React/Swiss Ephemeris/WebGL with
controlled model replies and speech boundary callbacks. Live authenticated chart
interaction, audible alignment and physical devices remain unverified.

`previous-native-build-20261015/` preserves the preceding local build after the
cleanup guard rejected deletion. It is not the production release. Do not deploy
that directory or include verification/archives in a site payload unintentionally.

Git preserves every artifact byte through `/dist/** -text` in `.gitattributes`.
