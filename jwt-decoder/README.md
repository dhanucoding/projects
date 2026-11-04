# JWT Decoder

Decode a JWT's header and payload for inspection — no signature verification.

## Features
- Pretty-printed header and payload with copy buttons
- `exp` / `nbf` / `iat` shown as ISO 8601 UTC with a relative time, plus an expired / not-yet-valid badge
- Summary of `alg`, `typ`, `kid`, `iss`, `sub`, `aud`
- Prominent "signature NOT verified" warnings, and an `alg: none` flag

## How it works
Entirely client-side: the token is never sent anywhere or stored. Segments are decoded
from base64url (padded, unpadded, or standard alphabet) and read as strict UTF-8, so
invalid bytes are reported rather than mangled. A leading `Bearer `, surrounding quotes,
and line wraps are tolerated. Output is written with `textContent`, never `innerHTML`.
Limitations: signatures are not verified, 5-part encrypted tokens (JWE) cannot be decoded,
and the header and payload must both be JSON objects. Tests: `node jwt-decoder/test.js`.

## Usage
Open `index.html` directly, or via the hub at `../index.html`.

---
Generated 2026-11-04 via the /new-app skill.
Idea source: [IDEAS.md](../IDEAS.md)
