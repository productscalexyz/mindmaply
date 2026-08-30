# Worked examples

Complete, valid sources in each grammar. All of these pass
`mindmaply validate` as-is.

## Mind map from a Markdown outline (the default choice)

```markdown
# Remote Work Playbook
## Communication
### Async first
- Write decisions down in shared docs
- Record short videos for complex topics
### Meetings
- Default to 25 minutes
- Always publish an agenda
## Tools
- Chat for quick questions
- Issue tracker as the source of truth
## Culture
### Trust
- Measure output, not hours
- No presence theater
### Onboarding
- Buddy for the first month
- First PR in week one
```

## Org chart (flowchart grammar, top-down)

```
flowchart TD
CEO["Chief Executive"]
CEO --> CTO["Engineering"]
CEO --> CPO["Product"]
CEO --> CFO["Finance"]
CTO --> BE["Backend"]
CTO --> FE["Frontend"]
CPO --> Des["Design"]
CPO --> PM["Product Mgmt"]
CFO --> Acct["Accounting"]
```

## Process flow (flowchart grammar, with a cycle back)

```
flowchart LR
Start["Start"]
Start --> Input["User types syntax"]
Input --> Valid["Valid syntax?"]
Valid --> Parse["Parse tree"]
Valid --> Error["Highlight error"]
Error --> Input
Parse --> Render["Render SVG"]
Render --> Output["Live diagram updates"]
```

## Mind map in Mermaid mindmap grammar

```
mindmap
  root((Mindmaply))
    What it is
      Organizes information
      Shows hierarchy visually
    Fast
      Polished interactions
      Keyboard shortcuts
    Beautiful by default
      Auto-colored branches
      Curated palette
```

## Markdown with theme frontmatter

```markdown
---
direction: TD
theme.palette: #4B96E6, #B355D0, #55A996, #E5884B, #EBB94A
theme.fontSize: 16
---
# Product Launch
## Before
- Landing page live
- Press kit ready
## Day of
- Post announcement
- Monitor feedback
## After
- Thank early users
- Ship the first fix fast
```

## What good output looks like

For a substantial input (an article, a talk, a transcript), a good map has
roughly 25-70 nodes across 3-4 levels: the main themes as top-level branches,
sub-topics beneath them, and concrete specifics (key claims, names, numbers,
steps, examples) as leaves. Labels stay under about 8 words. A reader should be
able to reconstruct the substance of the input from the map alone.
