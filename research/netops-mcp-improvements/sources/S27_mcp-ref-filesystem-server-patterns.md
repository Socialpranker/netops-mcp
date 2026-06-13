---
id: S27
url: https://github.com/modelcontextprotocol/servers/blob/main/src/filesystem/index.ts
title: MCP Reference Server — Filesystem (Official Tool Patterns)
channel: github-code
access: open
subquestion_ids: [ST2]
credibility: 5
recency: 5
bias: 1
date: 2026
---
# MCP Reference Filesystem Server — Tool Design Patterns

## Tool Count
12 tools: read_file, read_text_file, read_media_file, read_multiple_files, write_file, edit_file, create_directory, list_directory, list_directory_with_sizes, directory_tree, move_file, search_files, get_file_info, list_allowed_directories
(read_file is deprecated alias for read_text_file)

## Description Pattern Examples

### Multi-sentence, use-case-specific descriptions:
"Read the complete contents of a file from the file system as text. Handles various text encodings and provides detailed error messages if the file cannot be read. Use this tool when you need to examine the contents of a single file. Use the 'head' parameter to read only the first N lines of a file, or the 'tail' parameter to read only the last N lines of a file."

"Read the contents of multiple files simultaneously. This is more efficient than reading files one by one when you need to analyze or compare multiple files. Each file's content is returned with its path as a reference. Failed reads for individual files won't stop the entire operation. Only works within allowed directories."

### Key patterns:
1. What it does (first sentence)
2. When to use it vs alternatives ("Use this tool when...")
3. Important constraints ("Only works within allowed directories")
4. Parameter context ("Use the 'head' parameter to read only...")
5. Behavioral notes ("Failed reads for individual files won't stop the entire operation")

## Annotation Usage
- read_text_file: `{ readOnlyHint: true }` — explicitly set for read-only operations
- write_file, edit_file: readOnlyHint omitted (defaults to false = not read-only)

## Schema Pattern
Zod schemas with `.describe()` on every field:
```ts
tail: z.number().optional().describe('If provided, returns only the last N lines of the file')
```

## Deprecated Tool Handling
read_file description: "DEPRECATED: Use read_text_file instead." — direct guidance in description.

## netops relevance
Filesystem server's 12-tool design for a file I/O domain maps well to netops' 19-tool design for network diagnostics. Similar split: basic ops (read_file, write_file) vs composite (read_multiple_files) vs utility (get_file_info, list_allowed_directories). Filesystem labels deprecated tools explicitly in description — netops could use same pattern if consolidating.
