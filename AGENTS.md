# AGENTS.md - AI Agent Instructions for Recipe Keeper

## Project Overview

Recipe Keeper is a web application for digitalizing and preserving family recipes. It uses Next.js 14, Supabase, and OpenAI Vision API to scan, store, and organize recipes.

---

## Tech Stack Quick Reference

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| Payments | Stripe (Checkout, Webhooks) |
| Edge | Cloudflare Workers |
| AI | OpenAI GPT-4 Vision API |
| PDF | @react-pdf/renderer |

---

## Project Structure

```
recipe-keeper/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth routes (login, signup)
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── recipes/           # Recipe-specific components
│   │   ├── forms/             # Form components
│   │   └── pdf/               # PDF generation components
│   ├── lib/
│   │   ├── supabase/          # Supabase client & utilities
│   │   ├── validations/       # Zod schemas
│   │   └── utils.ts           # Utility functions
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript types
│   └── styles/                # Global styles
├── supabase/
│   ├── migrations/            # Database migrations
│   └── functions/             # Edge Functions
├── cloudflare/
│   └── workers/               # Cloudflare Workers
└── docs/                      # Documentation
```

---

## Coding Standards

### TypeScript
- Strict mode enabled
- No `any` types - use proper typing
- Use interfaces for objects, types for unions/primitives
- Export types from `src/types/`

### React/Next.js
- Use Server Components by default
- Add `'use client'` only when needed (interactivity, hooks)
- Use App Router conventions
- Implement loading.tsx and error.tsx for each route group

### Styling
- Use Tailwind CSS classes
- Follow the peach color palette defined in tailwind.config.ts
- Use shadcn/ui components as base
- Mobile-first responsive design

### File Naming
- Components: PascalCase (RecipeCard.tsx)
- Utilities: camelCase (formatDate.ts)
- Types: PascalCase with `.types.ts` suffix
- Hooks: camelCase with `use` prefix (useRecipes.ts)

---

## Database Schema

### Tables

#### profiles
```sql
- id: uuid (FK to auth.users)
- display_name: text
- avatar_url: text
- created_at: timestamptz
- updated_at: timestamptz
- credits: integer (default 5 for new users)
```

#### recipes
```sql
- id: uuid (PK)
- user_id: uuid (FK to profiles)
- title: text (required)
- description: text
- servings: integer
- prep_time_minutes: integer
- cook_time_minutes: integer
- difficulty: enum ('easy', 'medium', 'hard')
- category_id: uuid (FK to categories)
- source: text (e.g., "Mom", "Grandma")
- source_type: enum ('family', 'cookbook', 'website', 'other')
- notes: text
- is_favorite: boolean
- is_archived: boolean
- original_image_url: text (scanned recipe image)
- created_at: timestamptz
- updated_at: timestamptz
```

#### recipe_ingredients
```sql
- id: uuid (PK)
- recipe_id: uuid (FK to recipes)
- name: text (required)
- quantity: decimal
- unit: text
- notes: text
- order_index: integer
```

#### recipe_steps
```sql
- id: uuid (PK)
- recipe_id: uuid (FK to recipes)
- step_number: integer
- instruction: text (required)
- image_url: text
- timer_minutes: integer
```

#### recipe_images
```sql
- id: uuid (PK)
- recipe_id: uuid (FK to recipes)
- image_url: text (required)
- is_primary: boolean
- caption: text
- created_at: timestamptz
```

#### categories
```sql
- id: uuid (PK)
- name: text (required)
- slug: text (unique)
- icon: text
- order_index: integer
```

#### collections
```sql
- id: uuid (PK)
- user_id: uuid (FK to profiles)
- name: text (required)
- description: text
- created_at: timestamptz
```

#### recipe_collections
```sql
- recipe_id: uuid (FK to recipes)
- collection_id: uuid (FK to collections)
```

#### tags
```sql
- id: uuid (PK)
- user_id: uuid (FK to profiles)
- name: text (required)
```

#### recipe_tags
```sql
- recipe_id: uuid (FK to recipes)
- tag_id: uuid (FK to tags)
```

---

## Key Components to Build

### Pages (src/app/)
1. `/(auth)/login/page.tsx` - Login form
2. `/(auth)/signup/page.tsx` - Registration form
3. `/(dashboard)/page.tsx` - Recipe library
4. `/(dashboard)/recipes/new/page.tsx` - Add recipe
5. `/(dashboard)/recipes/[id]/page.tsx` - View recipe
6. `/(dashboard)/recipes/[id]/edit/page.tsx` - Edit recipe
7. `/(dashboard)/scan/page.tsx` - Scan recipe
8. `/(dashboard)/recipe-book/page.tsx` - Generate PDF book

### Components (src/components/)
1. `recipes/RecipeCard.tsx` - Recipe preview card
2. `recipes/RecipeForm.tsx` - Create/edit recipe form
3. `recipes/IngredientInput.tsx` - Ingredient list input
4. `recipes/StepInput.tsx` - Step-by-step input
5. `recipes/ImageUpload.tsx` - Image upload component
6. `recipes/RecipeScanner.tsx` - AI scanning interface
7. `pdf/RecipeBookPDF.tsx` - PDF template
8. `pdf/RecipePage.tsx` - Single recipe PDF page

### Hooks (src/hooks/)
1. `useRecipes.ts` - CRUD operations for recipes
2. `useCategories.ts` - Category management
3. `useRecipeScanner.ts` - AI scanning logic
4. `useImageUpload.ts` - Image upload to Supabase Storage

---

## Supabase Edge Functions

### analyze-recipe
- **Path**: `/functions/v1/analyze-recipe`
- **Method**: POST
- **Input**: `{ imageUrl: string }` or `{ base64Image: string }`
- **Output**: Extracted recipe data
- **Uses**: OpenAI GPT-4 Vision API

### generate-pdf
- **Path**: `/functions/v1/generate-pdf`
- **Method**: POST
- **Input**: `{ recipeIds: string[], options: PdfOptions }`
- **Output**: PDF file URL or base64

---

## Cloudflare Workers

### image-optimizer
- **Purpose**: Resize and optimize uploaded images
- **Input**: Original image URL
- **Output**: Optimized image URL with CDN caching
- **Features**: WebP conversion, multiple sizes, lazy loading support

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI (for Edge Functions)
OPENAI_API_KEY=

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Common Tasks

### Adding a New Recipe Field
1. Add migration in `supabase/migrations/`
2. Update TypeScript types in `src/types/recipe.types.ts`
3. Update Zod schema in `src/lib/validations/recipe.ts`
4. Update form in `src/components/recipes/RecipeForm.tsx`
5. Update display in recipe view page

### Adding a New Category
1. Insert into `categories` table via migration
2. Categories are seeded, not user-created

### Implementing New Edge Function
1. Create function in `supabase/functions/<name>/index.ts`
2. Add types in `src/types/`
3. Deploy with `supabase functions deploy <name>`

---

## Testing Strategy

### Unit Tests
- Use Vitest for unit tests
- Test utility functions, hooks, and Zod schemas
- Location: `__tests__/` folders or `.test.ts` files

### Integration Tests
- Test Supabase queries with test database
- Test Edge Functions locally with `supabase functions serve`

### E2E Tests
- Use Playwright for E2E tests
- Test critical flows: auth, recipe CRUD, scanning, PDF export

---

## Performance Considerations

1. **Images**: Always optimize before storage, use WebP format
2. **Queries**: Use proper indexes, avoid N+1 queries
3. **Caching**: Implement React Query caching, use Cloudflare CDN
4. **Bundle**: Use dynamic imports for PDF generation components
5. **RLS**: Ensure Row Level Security policies are efficient

---

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Service role key only in Edge Functions, never client
- [ ] File upload validation (type, size)
- [ ] Input sanitization via Zod
- [ ] CORS configured properly
- [ ] Rate limiting on Edge Functions
- [ ] No sensitive data in client bundle

---

## Deployment

### Frontend (Vercel)
```bash
vercel deploy
```

### Supabase
```bash
supabase db push
supabase functions deploy
```

### Cloudflare Workers
```bash
wrangler deploy
```
