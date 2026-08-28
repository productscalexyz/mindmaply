# Mermaid grammar (minimal subset)

Mindmaply parses a deliberately small Mermaid subset. Two grammars are accepted;
`mindmaply validate --format mermaid` flags every line outside them.

## Flowchart grammar

```
flowchart LR
a[Start] --> b[Review the draft]
b --> c["Approved?"]
c --> d((Done))
style d fill:#55A99633,stroke:#55A996
```

- First line: `flowchart LR` or `flowchart TD` (`TB` is accepted as an alias of TD).
- Node ids: single words (letters, digits, underscores).
- Node forms: `id[Label]`, `id["Label with punctuation"]`, `id((Circle label))`, or a bare `id` (underscores in a bare id render as spaces).
- Edges: exactly `id --> id`, one per line. Nodes may be declared inline on either side of the arrow.
- `style <id> fill:...,stroke:...,color:...,stroke-dasharray:...` lines are supported (comma-separated `key:value` pairs).
- `%%` comment lines are ignored.
- At least one node must have no incoming arrow (it becomes the root).

NOT supported (common full-Mermaid features that fail validation): chained
edges (`a --> b --> c`), edge labels (`a -->|yes| b`), dashed/dotted arrows
(`-.->`), `subgraph`/`end` blocks, `classDef` lines and `:::class` annotations
(use `style` lines instead), `direction` lines inside the body, semicolons at
line ends, shapes other than rect/quoted-rect/circle.
Rewrite such documents into the subset (one edge per line, flatten subgraphs)
before rendering.

## Mindmap grammar

Mermaid's indentation-based mindmap block also works:

```
mindmap
  root((Central topic))
    First branch
      A detail
      Another detail
    Second branch
      ::icon(fa fa-book)
      Deeper item
```

- First line: `mindmap`.
- One node per line; relative indentation defines the hierarchy.
- `root((Label))` gives the root a circle; plain lines are rect nodes.
- `::icon(...)` lines attach an icon name to the node above (parsed, not yet drawn).
- `<br/>` inside a label is a line break.

## Inline config

Rendering config can travel with mermaid source via an init directive on the
first line:

```
%%{init: {"mindmaply": {"edgeStyle": "curved", "theme": {"palette": ["#4B96E6", "#B355D0"], "fontSize": 16}}}}%%
flowchart TD
plan[Plan] --> build[Build]
plan --> test[Test]
```

The `theme` object takes the same keys as markdown frontmatter (`palette`,
`fontFamily`, `fontSize`, `textColor`, `canvasBg`, `rootBg`, `nodeBg`,
`edgeStrokeWidth`, `wrapWidth`, `typography`, `nodeStyle`).
