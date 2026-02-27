# Tour WebApp

A Next.js 14+ application for managing tours, transfers, and packages.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.local.example .env.local
```

3. Fill in your environment variables in `.env.local`

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - React components
- `src/lib/` - Utility functions and integrations
- `src/types/` - TypeScript type definitions
- `src/db/` - Database schema and seeds

## TODO

- [ ] Set up Supabase client
- [ ] Configure Stripe integration
- [ ] Implement authentication
- [ ] Add database schema
- [ ] Implement booking system
- [ ] Add admin dashboard functionality
