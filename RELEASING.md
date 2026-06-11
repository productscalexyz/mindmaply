# Releasing mindmaply-core

`mindmaply-core` (under `packages/core`) is the only published package. The
editor app (`apps/editor`) is private and ships via Vercel, not npm.

Releases use [Changesets](https://github.com/changesets/changesets).

## As a contributor

If your PR changes `packages/core`, add a changeset describing the bump:

```bash
pnpm changeset
```

Pick `patch` or `minor`, write a one-line summary, and commit the generated
file in `.changeset/`. That's all you need to do — maintainers handle the
actual publish.

## As a maintainer

When you're ready to cut a release from `main`:

```bash
# 1. Consume pending changesets: bumps packages/core version + writes CHANGELOG
pnpm changeset version
git commit -am "release: version packages"

# 2. Build and publish to npm
pnpm release        # = pnpm --filter mindmaply-core build && changeset publish

# 3. Push the version commit and tags
git push --follow-tags
```

`changeset publish` only publishes packages whose version isn't already on npm,
and respects `"access": "public"` from `.changeset/config.json`.

> First publish: make sure you're authenticated with `npm whoami`, and that the
> `mindmaply-core` name is still available / owned by the publishing account.
