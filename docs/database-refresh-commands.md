# Database Refresh Commands

Run these commands after making changes to the church database (imports, enrichments, deletions).

---

## Stats-Only Refresh (Fast, Free)

**Use when:** Minor database updates, count corrections, after enrichment batches.

**Duration:** ~5-10 minutes

```bash
# 1. Sync cities table (if new cities were added)
npx tsx scripts/sync-cities.ts

# 2. Regenerate stats and FAQs only (no AI costs)
npx tsx scripts/generate-location-content.ts --all --stats-only

# 3. Invalidate caches
curl -X POST "https://findachurch.com/api/revalidate?secret=$REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"tag": "featured-cities"}'
curl -X POST "https://findachurch.com/api/revalidate?secret=$REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"tag": "denomination-stats"}'
curl -X POST "https://findachurch.com/api/revalidate?secret=$REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"tag": "church-counts"}'
curl -X POST "https://findachurch.com/api/revalidate?secret=$REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"tag": "states"}'
curl -X POST "https://findachurch.com/api/revalidate?secret=$REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"tag": "cities"}'
```

---

## Full Regeneration (Slow, Costs AI Credits)

**Use when:** Major database changes, new denomination coverage, significant church additions (100+).

**Duration:** ~2-3 hours (rate limited for AI calls)

```bash
# 1. Sync cities table
npx tsx scripts/sync-cities.ts

# 2. Regenerate ALL content including AI-generated text
npx tsx scripts/generate-location-content.ts --all

# 3. Invalidate all caches
curl -X POST "https://findachurch.com/api/revalidate?secret=$REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"tag": "featured-cities"}'
curl -X POST "https://findachurch.com/api/revalidate?secret=$REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"tag": "denomination-stats"}'
curl -X POST "https://findachurch.com/api/revalidate?secret=$REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"tag": "church-counts"}'
curl -X POST "https://findachurch.com/api/revalidate?secret=$REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"tag": "states"}'
curl -X POST "https://findachurch.com/api/revalidate?secret=$REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"tag": "cities"}'
curl -X POST "https://findachurch.com/api/revalidate?secret=$REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"tag": "state-content"}'
curl -X POST "https://findachurch.com/api/revalidate?secret=$REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"tag": "city-content"}'
```

---

## Single State Refresh

**Use when:** You only updated churches in one state.

```bash
# Replace TX with your state abbreviation
npx tsx scripts/generate-location-content.ts --state TX

# Invalidate that state's caches
curl -X POST "https://findachurch.com/api/revalidate?secret=$REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"tag": "state-content-TX"}'
curl -X POST "https://findachurch.com/api/revalidate?secret=$REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"tag": "church-count-TX"}'
curl -X POST "https://findachurch.com/api/revalidate?secret=$REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"tag": "cities-TX"}'
```

---

## Setup

Before running cache invalidation commands, set your secret:

```bash
export REVALIDATE_SECRET="your-secret-from-env-local"
```

Or replace `$REVALIDATE_SECRET` in the commands with your actual secret value.

---

## What Gets Updated

| Refresh Type | Church Counts | FAQs | AI Content | Sitemaps |
|--------------|---------------|------|------------|----------|
| Stats-only   | ✅            | ✅   | ❌         | ✅ (24h) |
| Full         | ✅            | ✅   | ✅         | ✅ (24h) |

---

## Verification Checklist

After running refresh commands, verify:

- [ ] Homepage shows correct total church count
- [ ] Featured cities list is accurate
- [ ] Denomination stats bar chart is correct
- [ ] State pages show correct church counts
- [ ] City pages show correct church counts
- [ ] FAQ answers contain updated numbers
