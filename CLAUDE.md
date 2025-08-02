# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (runs on port 8080)
- **Build for production**: `npm run build`
- **Build for development**: `npm run build:dev`
- **Lint code**: `npm run lint`
- **Preview production build**: `npm run preview`

## Tech Stack

- **Framework**: Vite + React 18 + TypeScript
- **UI Library**: shadcn/ui with Radix UI components
- **Styling**: Tailwind CSS with custom animations and gradients
- **State Management**: @tanstack/react-query for server state
- **Forms**: react-hook-form with @hookform/resolvers and zod validation
- **Database**: Supabase with TypeScript types
- **Routing**: react-router-dom v6
- **Icons**: lucide-react
- **Theming**: next-themes for dark/light mode
- **Notifications**: sonner for toast notifications

## Project Architecture

This is an event management application for seat reservations with a code-based access system.

### Core Flow
1. **Code Entry** (`/`) - Users enter 6-digit access codes
2. **Seat Selection** (`/select-seat`) - Available if user hasn't reserved
3. **Reservation Success** (`/success`) - Confirmation page
4. **Reservation Details** (`/details`) - View existing reservations
5. **404 Handler** (`*`) - Not found page

### Directory Structure
- `src/pages/` - Main application pages/routes
- `src/components/` - Custom components (ReservationForm, SeatMap)
- `src/components/ui/` - shadcn/ui components (reusable UI primitives)
- `src/integrations/supabase/` - Database client and TypeScript types
- `src/hooks/` - Custom React hooks (use-mobile, use-toast)
- `src/lib/` - Utility functions
- `supabase/migrations/` - Database migration files

### Key Configuration
- **Path Aliases**: `@/*` maps to `./src/*`
- **TypeScript**: Lenient config with disabled strict null checks and unused variables
- **Vite**: Development server on port 8080, includes lovable-tagger for development mode
- **ESLint**: Standard React + TypeScript rules with unused variables disabled

### Database Schema
Uses Supabase with tables:
- `usuario` table with fields including `codigo` (6-digit access code) and `reservado` (reservation status)

### Styling Approach
- Custom CSS classes with Tailwind: `gradient-animated`, `glass-primary`, `btn-primary`
- Custom animations: `animate-float`, `animate-scale-in`, `animate-glow-pulse`
- Event-themed color variables: `event-primary`, `event-secondary`

### Development Notes
- Uses React Query for server state management
- Form validation with zod schemas
- Toast notifications for user feedback
- Responsive design with mobile-first approach
- TypeScript with relaxed strictness for rapid development