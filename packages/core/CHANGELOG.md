# mindmaply-core

## 0.3.0

### Minor Changes

- 57cfb0c: Add a `mindmaply` CLI (render, validate, share, convert) so shells and AI agents can use the library without writing a Node script. Source comes from a file or stdin; format is auto-detected. `share --short` trades the long encoded payload for a short `mindmaply.app/s/<id>` link, falling back to the long form if the API cannot be reached.
