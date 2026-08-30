# Share URL encoding

`mindmaply share` prints these URLs ready-made; this file documents how they
are built, for cases where you need to construct them programmatically.

## Payload

A shared diagram is one JSON payload, compressed with lz-string's
`compressToEncodedURIComponent` into a URL-safe string called `d`:

```json
{
  "v": 1,
  "source": "# Root\n- branch",
  "format": "markdown",
  "direction": "LR",
  "edgeStyle": "curved"
}
```

- `v` is always 1. `format` is `markdown` or `mermaid`. `direction` is `LR` or `TD`.
- `edgeStyle` (`curved` | `straight`) is optional; omitted means the format default.
- Decoding is whitelist-validated: any unexpected field shape makes the whole link invalid.

In JavaScript, with the `mindmaply-core` package:

```js
import { encodeShare, buildShareUrl, buildEmbedUrl, buildShareLandingUrl } from 'mindmaply-core'
const payload = { v: 1, source, format: 'markdown', direction: 'LR' }
const d = encodeShare(payload)
```

## URL shapes

With `d` as the encoded payload:

| URL | Purpose |
| --- | --- |
| `https://mindmaply.app/#/editor?d=<d>` | Opens the diagram in the live editor |
| `https://mindmaply.app/#/embed?d=<d>` | Chrome-less canvas for iframes |
| `https://mindmaply.app/s/<d>` | Share landing page; unfurls with a preview image when pasted in chat or social |
| `https://mindmaply.app/s/<id>` | The same landing page behind a short id (see below). Prefer this when handing a link to a person |
| `https://api.mindmaply.app/svg?d=<d>` | Static SVG image (works in `<img src>`) |
| `https://api.mindmaply.app/png?d=<d>` | Static PNG image |
| `https://api.mindmaply.app/og/<d>.png` | 2400x1260 social card image |

Embed snippet:

```html
<iframe src="https://mindmaply.app/#/embed?d=<d>" width="800" height="500"
        style="border:0;border-radius:12px" loading="lazy"></iframe>
```

## Short links

The `<d>` payload is long: a real map easily runs to a few thousand characters
in the URL. `POST https://api.mindmaply.app/shorten` with `{"d": "<d>"}` trades
it for a short id, returning `{"id": "<11 chars>", "url": "https://mindmaply.app/s/<id>"}`.
The id is content-addressed, so shortening the same map twice gives the same
link back. Anywhere a `d` is accepted, a short id works too.

`mindmaply share --short` does this call for you and is the easy path. Note the
editor `#/editor?d=` and `#/embed?d=` URLs cannot be shortened this way: the SPA
resolves the payload client-side and never asks the API.

## Limits

Share endpoints cap `source` at 20,000 characters. Longer sources still render
locally via the CLI, but links to them will be rejected by the API.
