---
id: S81
url: https://news.ycombinator.com/item?id=48331582
title: "HN: MCP vs CLI/Bash — The Emacs vs Vim of agents (major thread)"
channel: forum-discussion
access: open
subquestion_ids: [opposition]
credibility: 5
recency: 5
bias: 2
date: 2026-05-30
---
# HN: MCP vs CLI/Bash — Full Debate Thread

## Source context
Long HN thread (HN item 48331582) with extensive technical debate on MCP vs shell/CLI for AI agents.

## Core opposition argument (strongest version)

`_flux`:
> "The token overhead is something I've been feeling lately. It's annoying to see the context window shrink just from tool definitions that never even get triggered."
> "MCPs are impossible to combine this way: everything you feed or get from them goes through the model and consumes tokens."
> "With shell you can pass data from one component to another directly, not only being cheaper, faster, but also preserving complete integrity."

`krackers` (HN item 47735584):
> "What most people seem to ultimately be debating is 'dedicated tool calls' (which is what MCP boils down to) versus a stateful environment that admits a single uber-tool (bash) that can compose things via scripting. I guess this is what riles people up, like emacs vs vim."

`jimbokun` (the killer line):
> "Go ahead. We will call this new MCP 'bash'. It will allow you to stream the output of one command to the input of another incrementally as the data is generated."

Another comment (HN item 47714383):
> "MCP pollutes the context, if you don't care about wasting context token for all MCP tools, go ahead and use MCP, but you should know that cli tool+skill can perfectly replace it with less token overhead and better matching due to skill's front matter"

HN item 47646880:
> "For me, as a dev, I'd much rather just throw together a quick bash wrapper. But I can see the appeal for the non-technical side of our team who just want to 'plug and play' with AI connections without asking for a PR."

## Strongest counter-argument (pro-MCP)

`827a`:
> "People seem to think that MCP exists to give agents more capability. That could not be further from the truth, which is actually the opposite: MCP exists to take capability away from agents. It exists to control them."

> "You're right that having a shell is the ultimate tool, and an agent with a shell seems to perform better than one without one. But, making shells safe is really damn hard; e.g. in the context of running an agent on behalf of a SaaS customer in your AWS environment. For now some companies are accepting the performance/security tradeoff of disabling the shell and focusing on specialized tools."

`827a` (MCP spec):
> "You could literally, deterministically, zero AI, code-gen a CLI from an MCP specification, just like you can with an OpenAPI specification... But the problem with a CLI is that it requires a shell environment, and not everywhere you may want to run an agent should or can have access to a shell."

## Significance
The "just use bash" argument is STRONG for developer-facing tools but WEAK for:
1. Non-technical users who can't compose CLI pipelines
2. Security-sensitive contexts where shell access is restricted
3. Remote agent deployments without shell
For Ivan's netops-mcp targeting devops engineers on their own machines, the CLI argument is at its STRONGEST.
