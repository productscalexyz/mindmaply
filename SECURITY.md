# Security Policy

## Reporting a vulnerability

Please do **not** open a public issue for security problems.

Email **gaurav@mindmaply.app** with a description and reproduction steps, or use GitHub's [private vulnerability reporting](https://github.com/productscalexyz/mindmaply/security/advisories/new) if enabled.

You'll get an acknowledgement within a few days. Please give us reasonable time to ship a fix before public disclosure.

## Scope

The most security-relevant surface is `mindmaply-core`'s output: it turns untrusted Mermaid/Markdown input into an SVG string that consumers typically inject into the DOM. Bugs that allow script execution or markup injection through node labels or style values are high priority.
