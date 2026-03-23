# Elevate Community Impact

A React-based web application for community engagement and management.

## Project Info

- **Type**: Web Application
- **Stack**: React, TypeScript, Vite, Tailwind CSS, Supabase

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Supabase
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or bun
- Supabase project (get URL & anon key from dashboard)

### Installation

```sh
# Install dependencies
npm install
# or
bun install
```

### Development

```sh
# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Build

```sh
# Build for production
npm run build
```

### Testing

```sh
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## Deployment to Vercel

1. **Environment Variables** (required for production):
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase public anon key
   
   Add in Vercel Dashboard: Project Settings > Environment Variables

2. **Deploy**:
   ```sh
   vercel --prod
   ```

**Note**: Build now succeeds even without env vars (uses mock client). Real Supabase functions require env vars set.

## Project Structure

```
src/
├── components/     # React components
├── contexts/      # React contexts
├── hooks/         # Custom React hooks
├── integrations/  # Third-party integrations (Supabase)
├── lib/           # Utility functions
├── pages/         # Page components
└── test/          # Test setup and utilities
```

## License

MIT
