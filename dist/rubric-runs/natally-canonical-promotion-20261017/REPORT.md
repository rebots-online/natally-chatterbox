# Canonical Natally replacement

As at bundle commit `7378d5caba9bc20e73019a228e64e22ac1f81fbe`, this
natally-chatterbox checkout replaces the former natally-ai-studio deployment at
https://natally.surge.sh. Surge `1792261498437`; 67/67 served SHA-256 matches.
The existing production API was updated to the same streaming implementation,
deploy `6ad3bcda0aefe97aace3e3a6`. Its existing exact origin was retained and
OPTIONS 204 verified. No provider/model/auth/rate/tool changes.

An ordinary signed-in production prompt asking for one sentence about a starry
evening produced a real hosted reply and completed 1/1 ready/played. The normal
status later showed 8/8 saved local cues. The first submission had 0/8 and explicitly
reported no prepared submission cue. That case fails immediacy; deployment is
not zero-latency acceptance. No listening or physical-phone PASS.

[Served payload receipt](live-payload-manifest.json), [native status](production-status.json),
[ordinary production status still](production-status.jpg). Private profile and
full transcript are not included in this evidence folder.
