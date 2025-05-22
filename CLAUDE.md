# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on port 9002 with Turbopack
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit AI with file watching
- `npm run lint` - Run Next.js linter
- `npm run typecheck` - TypeScript type checking
- `npm run build` - Production build

## Architecture Overview

**MediReport** is a Next.js medical report editor with AI integration, voice recognition, and template systems.

### Core Concepts

- **Reports**: Editable documents with rich text content stored as TipTap JSON
- **Templates**: Reusable structures with field syntax (`[FieldName]` for basic fields, `[OptionA|OptionB]` for multi-choice)
- **Template Insertion**: Converts template syntax into interactive report fields via custom TipTap extensions

### Data Flow

- Dual context pattern: `ReportContext` (current report state) and `TemplateContext` (template management)
- Separate TipTap editor instances for reports and templates
- File-based persistence to local filesystem (no database)
- Dirty state tracking for unsaved changes

### Key Components

- `src/components/ReportWorkspace.tsx`: Main UI orchestrator with voice integration
- `src/components/editor/RichTextEditor.tsx`: Core TipTap editor wrapper
- `src/components/editor/extensions/`: Custom nodes for template field handling
- `src/contexts/`: React contexts for report and template state management

### Tech Stack

- Next.js 15.2.3 with TypeScript
- TipTap editor with custom extensions
- Radix UI + shadcn/ui components
- Firebase backend/auth
- Google Genkit AI framework
- Voice recognition integration
- File-based data persistence

### Special Features

- Real-time voice transcription with editor integration
- PDF export for reports
- Custom TipTap nodes for interactive template fields
- Path alias `@/*` maps to `./src/*`