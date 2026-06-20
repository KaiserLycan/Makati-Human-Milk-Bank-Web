<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Context
This is a Next.js project using the App Router, React, TypeScript, and Tailwind CSS.

## Agent Role
You are an expert frontend engineer. Your primary task is translating Figma designs via the MCP server into production-ready Next.js components.

## Figma Translation Rules
* Match spacing, typography, and colors exactly to the Figma design tokens.
* Use Tailwind CSS utility classes exclusively. Do not generate custom CSS files or inline styles.
* Wrap components in semantic HTML tags (nav, section, article, header, footer) rather than generic divs where possible.
* If the Figma file does not provide mobile views, infer standard responsive behavior using Tailwind's sm, md, and lg breakpoints.
* Always define and use Tailwind configuration variables instead of arbitrary values (e.g., use `text-blue-600` instead of `text-[#2563eb]`).

## Next.js Coding Standards
* Default to React Server Components. Only add the 'use client' directive when hooks, interactivity, or browser APIs are explicitly required.
* Place all new standalone UI components in the `src/components/ui` directory.
* Use strict TypeScript interfaces for all component props. Do not use the 'any' type.
* Export components as default exports.
* Do not leave placeholder comments in the code. Write the complete implementation.

## Assets and Icons
* Use the `lucide-react` library for standard icons instead of exporting them from Figma.
* Only export SVGs from Figma if they are complex custom illustrations or brand logos.