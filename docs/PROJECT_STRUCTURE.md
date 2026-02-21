# Project Structure

## Complete Directory Layout

```
recipe-keeper/
│
├── .env.local                          # Local environment variables (git-ignored)
├── .env.example                        # Environment variables template
├── .eslintrc.json                      # ESLint configuration
├── .gitignore                          # Git ignore rules
├── .prettierrc                         # Prettier configuration
├── next.config.js                      # Next.js configuration
├── tailwind.config.ts                  # Tailwind CSS configuration
├── tsconfig.json                       # TypeScript configuration
├── package.json                        # Dependencies and scripts
├── README.md                           # Project documentation
├── AGENTS.md                           # AI agent instructions
│
├── public/                             # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
│       ├── placeholder-recipe.jpg
│       └── cover-templates/            # Recipe book cover templates
│           ├── classic.jpg
│           ├── modern.jpg
│           └── rustic.jpg
│
├── mobile/                             # React Native (Expo) Mobile App
│   ├── app/                            # Expo Router (screens/navigation)
│   ├── assets/                         # Images, fonts, and splash screens
│   ├── components/                     # Native UI components
│   ├── contexts/                       # React Contexts (Auth, Language)
│   ├── lib/                            # Supabase client, utils
│   ├── package.json                    # Mobile dependencies
│   ├── app.json                        # Expo app configuration
│   └── tailwind.config.js              # NativeWind configuration
│
├── src/
│   │
│   ├── app/                            # Next.js App Router
│   │   ├── layout.tsx                  # Root layout (providers, fonts)
│   │   ├── page.tsx                    # Landing page
│   │   ├── globals.css                 # Global styles
│   │   ├── loading.tsx                 # Root loading state
│   │   ├── error.tsx                   # Root error boundary
│   │   ├── not-found.tsx               # 404 page
│   │   │
│   │   ├── (auth)/                     # Auth route group (no layout nesting)
│   │   │   ├── layout.tsx              # Auth pages layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx            # Login page
│   │   │   ├── signup/
│   │   │   │   └── page.tsx            # Signup page
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx            # Password reset request
│   │   │   └── reset-password/
│   │   │       └── page.tsx            # Password reset form
│   │   │
│   │   ├── (dashboard)/                # Protected dashboard routes
│   │   │   ├── layout.tsx              # Dashboard layout (sidebar, header)
│   │   │   ├── page.tsx                # Dashboard home / recipe library
│   │   │   ├── loading.tsx             # Dashboard loading state
│   │   │   │
│   │   │   ├── recipes/
│   │   │   │   ├── page.tsx            # All recipes list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx        # Create new recipe (manual)
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # View single recipe
│   │   │   │       ├── edit/
│   │   │   │       │   └── page.tsx    # Edit recipe
│   │   │   │       └── loading.tsx     # Recipe loading state
│   │   │   │
│   │   │   ├── scan/
│   │   │   │   └── page.tsx            # Scan/upload recipe page
│   │   │   │
│   │   │   ├── categories/
│   │   │   │   ├── page.tsx            # All categories
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx        # Recipes in category
│   │   │   │
│   │   │   ├── collections/
│   │   │   │   ├── page.tsx            # All collections
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx        # Collection detail
│   │   │   │
│   │   │   ├── favorites/
│   │   │   │   └── page.tsx            # Favorite recipes
│   │   │   │
│   │   │   ├── recipe-book/
│   │   │   │   └── page.tsx            # Generate PDF recipe book
│   │   │   │
│   │   │   ├── search/
│   │   │   │   └── page.tsx            # Search results
│   │   │   │
│   │   │   └── settings/
│   │   │       └── page.tsx            # User settings / profile
│   │   │
│   │   └── api/                        # API routes (if needed)
│   │       └── webhooks/
│   │           └── route.ts            # Webhook handlers
│   │
│   ├── components/
│   │   │
│   │   ├── ui/                         # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   └── toaster.tsx
│   │   │
│   │   ├── layout/                     # Layout components
│   │   │   ├── Header.tsx              # Main header with nav
│   │   │   ├── Sidebar.tsx             # Dashboard sidebar
│   │   │   ├── Footer.tsx              # Footer
│   │   │   ├── MobileNav.tsx           # Mobile navigation
│   │   │   └── UserMenu.tsx            # User dropdown menu
│   │   │
│   │   ├── auth/                       # Authentication components
│   │   │   ├── LoginForm.tsx           # Login form
│   │   │   ├── SignupForm.tsx          # Signup form
│   │   │   ├── ForgotPasswordForm.tsx  # Password reset request
│   │   │   └── AuthGuard.tsx           # Route protection wrapper
│   │   │
│   │   ├── recipes/                    # Recipe components
│   │   │   ├── RecipeCard.tsx          # Recipe preview card
│   │   │   ├── RecipeGrid.tsx          # Grid of recipe cards
│   │   │   ├── RecipeList.tsx          # List view of recipes
│   │   │   ├── RecipeDetail.tsx        # Full recipe view
│   │   │   ├── RecipeForm.tsx          # Create/edit form
│   │   │   ├── RecipeHeader.tsx        # Recipe title, meta info
│   │   │   ├── IngredientList.tsx      # Display ingredients
│   │   │   ├── IngredientInput.tsx     # Input for ingredients
│   │   │   ├── StepList.tsx            # Display steps
│   │   │   ├── StepInput.tsx           # Input for steps
│   │   │   ├── RecipeActions.tsx       # Edit, delete, favorite buttons
│   │   │   ├── RecipeScanner.tsx       # AI scanning interface
│   │   │   ├── ScanPreview.tsx         # Preview extracted data
│   │   │   └── RecipeFilters.tsx       # Search and filter controls
│   │   │
│   │   ├── images/                     # Image components
│   │   │   ├── ImageUpload.tsx         # Single image upload
│   │   │   ├── MultiImageUpload.tsx    # Multiple images upload
│   │   │   ├── ImageGallery.tsx        # Image gallery display
│   │   │   ├── ImagePreview.tsx        # Image preview with zoom
│   │   │   └── DropZone.tsx            # Drag and drop zone
│   │   │
│   │   ├── categories/                 # Category components
│   │   │   ├── CategoryCard.tsx        # Category preview
│   │   │   ├── CategoryGrid.tsx        # Grid of categories
│   │   │   └── CategorySelect.tsx      # Category dropdown
│   │   │
│   │   ├── collections/                # Collection components
│   │   │   ├── CollectionCard.tsx      # Collection preview
│   │   │   ├── CollectionForm.tsx      # Create/edit collection
│   │   │   └── AddToCollection.tsx     # Add recipe to collection
│   │   │
│   │   ├── pdf/                        # PDF generation components
│   │   │   ├── RecipeBookPDF.tsx       # Main PDF document
│   │   │   ├── RecipePage.tsx          # Single recipe page
│   │   │   ├── CoverPage.tsx           # Book cover
│   │   │   ├── TableOfContents.tsx     # TOC page
│   │   │   ├── IndexPage.tsx           # Recipe index
│   │   │   ├── PDFPreview.tsx          # Preview before download
│   │   │   └── PDFStyles.tsx           # PDF styling constants
│   │   │
│   │   └── shared/                     # Shared components
│   │       ├── EmptyState.tsx          # Empty state displays
│   │       ├── LoadingSpinner.tsx      # Loading indicator
│   │       ├── ErrorDisplay.tsx        # Error messages
│   │       ├── ConfirmDialog.tsx       # Confirmation modal
│   │       ├── SearchInput.tsx         # Search input with icon
│   │       └── Pagination.tsx          # Pagination controls
│   │
│   ├── lib/                            # Utilities and configurations
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   ├── server.ts               # Server Supabase client
│   │   │   ├── middleware.ts           # Auth middleware helper
│   │   │   └── admin.ts                # Admin client (service role)
│   │   │
│   │   ├── validations/
│   │   │   ├── recipe.ts               # Recipe Zod schemas
│   │   │   ├── auth.ts                 # Auth Zod schemas
│   │   │   └── common.ts               # Shared validation schemas
│   │   │
│   │   ├── utils.ts                    # General utilities (cn, etc.)
│   │   ├── constants.ts                # App constants
│   │   └── formatters.ts               # Date, time, number formatters
│   │
│   ├── hooks/                          # Custom React hooks
│   │   ├── useRecipes.ts               # Recipe CRUD operations
│   │   ├── useRecipe.ts                # Single recipe operations
│   │   ├── useCategories.ts            # Category data
│   │   ├── useCollections.ts           # Collection operations
│   │   ├── useRecipeScanner.ts         # AI scanning logic
│   │   ├── useImageUpload.ts           # Image upload to storage
│   │   ├── useSearch.ts                # Search functionality
│   │   ├── useAuth.ts                  # Auth state and operations
│   │   ├── useDebounce.ts              # Debounce utility hook
│   │   └── useMediaQuery.ts            # Responsive breakpoints
│   │
│   ├── types/                          # TypeScript types
│   │   ├── recipe.types.ts             # Recipe-related types
│   │   ├── auth.types.ts               # Auth types
│   │   ├── database.types.ts           # Supabase generated types
│   │   └── api.types.ts                # API request/response types
│   │
│   ├── styles/                         # Additional styles
│   │   └── pdf.css                     # PDF-specific styles
│   │
│   └── providers/                      # React context providers
│       ├── AuthProvider.tsx            # Auth context
│       ├── QueryProvider.tsx           # React Query provider
│       └── ThemeProvider.tsx           # Theme context (if needed)
│
├── supabase/
│   │
│   ├── config.toml                     # Supabase local config
│   │
│   ├── migrations/                     # Database migrations
│   │   ├── 00001_create_profiles.sql
│   │   ├── 00002_create_categories.sql
│   │   ├── 00003_create_recipes.sql
│   │   ├── 00004_create_ingredients.sql
│   │   ├── 00005_create_steps.sql
│   │   ├── 00006_create_images.sql
│   │   ├── 00007_create_collections.sql
│   │   ├── 00008_create_tags.sql
│   │   ├── 00009_seed_categories.sql
│   │   └── 00010_create_rls_policies.sql
│   │
│   ├── functions/                      # Edge Functions
│   │   │
│   │   ├── analyze-recipe/
│   │   │   └── index.ts                # AI recipe extraction
│   │   │
│   │   ├── generate-pdf/
│   │   │   └── index.ts                # PDF generation
│   │   │
│   │   └── _shared/                    # Shared Edge Function code
│   │       ├── cors.ts                 # CORS headers
│   │       ├── auth.ts                 # Auth verification
│   │       └── types.ts                # Shared types
│   │
│   └── seed.sql                        # Initial seed data
│
├── cloudflare/
│   │
│   └── workers/
│       │
│       ├── image-optimizer/
│       │   ├── wrangler.toml           # Worker configuration
│       │   ├── src/
│       │   │   └── index.ts            # Image optimization worker
│       │   └── package.json
│       │
│       └── README.md                   # Cloudflare setup instructions
│
├── docs/                               # Documentation
│   ├── PRD.md                          # Product Requirements Document
│   ├── PROJECT_STRUCTURE.md            # This file
│   ├── DATABASE_SCHEMA.md              # Database documentation
│   ├── API_SPEC.md                     # API documentation
│   └── UI_DESIGN.md                    # Design system documentation
│
└── __tests__/                          # Test files
    ├── unit/
    │   ├── utils.test.ts
    │   └── validations.test.ts
    ├── integration/
    │   └── recipes.test.ts
    └── e2e/
        ├── auth.spec.ts
        └── recipes.spec.ts
```

## Key Directories Explained

### `/src/app`
Next.js 14 App Router pages. Uses route groups `(auth)` and `(dashboard)` to organize routes with different layouts.

### `/src/components`
React components organized by domain:
- `ui/` - Base shadcn/ui components
- `recipes/` - Recipe-specific components
- `pdf/` - PDF generation components
- `shared/` - Reusable utility components

### `/src/lib`
Utility functions and configurations:
- `supabase/` - Database client setup
- `validations/` - Zod schemas for form validation

### `/src/hooks`
Custom React hooks for data fetching and state management using React Query.

### `/supabase`
Supabase-specific files:
- `migrations/` - SQL migration files
- `functions/` - Deno-based Edge Functions

### `/cloudflare`
Cloudflare Workers for edge computing tasks like image optimization.

### `/mobile`
React Native application using the Expo framework. It is integrated tightly with NativeWind for styling and accesses the same Supabase database and Edge Functions as the web application. Features Expo Router for file-based routing.

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `RecipeCard.tsx` |
| Hooks | camelCase with `use` prefix | `useRecipes.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types | PascalCase with `.types.ts` | `recipe.types.ts` |
| Pages | `page.tsx` (Next.js convention) | `app/recipes/page.tsx` |
| Layouts | `layout.tsx` | `app/(dashboard)/layout.tsx` |
| API Routes | `route.ts` | `app/api/webhooks/route.ts` |
| Migrations | Numbered prefix | `00001_create_profiles.sql` |
