# Psalmlog Church Finder

A free, SEO-optimized national church directory that helps believers find the right faith community. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Browse Churches by Location**: National → State → City → Church hierarchy
- **Search & Filters**: Filter by denomination, worship style, and programs (kids ministry, youth groups, small groups)
- **AI-Generated Content**: "What to Expect" guides for first-time visitors
- **SEO Optimized**: Schema.org markup, meta tags, and XML sitemap
- **Psalmlog Integration**: CTAs and email capture for app promotion
- **Mobile Responsive**: Works on all devices

## URL Structure

```
/churches                        → National landing
/churches/texas                  → State page
/churches/texas/houston          → City page
/churches/texas/houston/lakewood → Church detail
/churches/search?q=scottsdale    → Search results
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd church-directory
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment example:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
CUSTOMERIO_SITE_ID=your_customer_io_site_id
CUSTOMERIO_API_KEY=your_customer_io_api_key
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
```

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the schema SQL in the Supabase SQL Editor:
```bash
cat scripts/schema.sql
```

3. (Optional) Seed the database with sample data:
```bash
# Set SUPABASE_SERVICE_KEY in your environment
npx ts-node --compiler-options '{"module":"commonjs"}' scripts/seed-database.ts
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the directory.

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── app/
│   ├── churches/
│   │   ├── page.tsx                    # National landing
│   │   ├── layout.tsx                  # Shared layout
│   │   ├── sitemap.ts                  # XML sitemap
│   │   ├── [state]/
│   │   │   ├── page.tsx                # State page
│   │   │   └── [city]/
│   │   │       ├── page.tsx            # City page
│   │   │       └── [church]/
│   │   │           └── page.tsx        # Church detail
│   │   └── search/
│   │       └── page.tsx                # Search results
│   └── api/
│       └── subscribe/
│           └── route.ts                # Email capture API
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ChurchCard.tsx
│   ├── Filters.tsx
│   ├── Pagination.tsx
│   ├── SearchBox.tsx
│   ├── Breadcrumbs.tsx
│   ├── PsalmlogCTA.tsx
│   └── EmailCaptureModal.tsx
├── lib/
│   ├── supabase.ts                     # Supabase client
│   ├── data.ts                         # Data access functions
│   └── constants.ts                    # App constants
└── types/
    └── database.ts                     # TypeScript types
```

## Database Schema

### Tables

- **states**: US states with church/city counts
- **cities**: Cities with church counts and coordinates
- **churches**: Church listings with all details

### Key Fields (churches)

| Field | Type | Description |
|-------|------|-------------|
| name | text | Church name |
| address, city, state, zip | text | Location |
| lat, lng | decimal | Coordinates |
| denomination | text | Denomination |
| worship_style | text[] | Contemporary, Traditional, etc. |
| service_times | jsonb | Service schedule |
| has_kids_ministry | boolean | Kids program flag |
| ai_description | text | AI-generated description |
| ai_what_to_expect | text | Visitor guide |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Cloudflare Worker Route

Add to your existing Cloudflare worker:

```javascript
if (url.pathname === '/churches' || url.pathname.startsWith('/churches/')) {
  const vercelUrl = `https://your-project.vercel.app${url.pathname}${url.search}`;
  return fetch(vercelUrl, {
    method: request.method,
    headers: request.headers
  });
}
```

## Attribution

Built for Psalmlog as an organic acquisition channel for the biblical guidance app.

All links include UTM parameters:
```
?utm_source=church_finder&utm_medium=directory&utm_campaign={page_type}&utm_content={cta_location}
```

## License

Proprietary - Psalmlog
