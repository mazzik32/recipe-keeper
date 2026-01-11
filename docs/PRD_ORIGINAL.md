# Recipe Keeper 🍳

A modern web application for digitalizing and preserving family recipes. Scan recipes from photos or PDFs, organize them by category, and generate beautiful recipe book PDFs.

## Features

- **Recipe Scanning**: Upload photos or PDFs of handwritten/printed recipes and let AI extract the content
- **Recipe Management**: Create, edit, organize, and search your recipe collection
- **Image Support**: Add photos to recipe steps and finished dishes
- **Categories & Tags**: Organize recipes by type (appetizers, main course, desserts, etc.)
- **Source Tracking**: Remember where each recipe came from (Mom, Grandma, etc.)
- **Recipe Book Export**: Generate beautifully styled PDF recipe books
- **User Authentication**: Secure login/signup with personal recipe libraries

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Edge Computing**: Cloudflare Workers (image optimization)
- **AI**: OpenAI GPT-4 Vision API
- **PDF Generation**: @react-pdf/renderer

## Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- OpenAI API key
- Cloudflare account (optional, for image optimization)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd recipe-keeper
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Run the database migrations:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# OpenAI
OPENAI_API_KEY=<your-openai-api-key>

# Cloudflare (optional)
CLOUDFLARE_ACCOUNT_ID=<your-account-id>
CLOUDFLARE_API_TOKEN=<your-api-token>
```

### 5. Deploy Supabase Edge Functions

```bash
npx supabase functions deploy analyze-recipe
npx supabase functions deploy generate-pdf
```

Set secrets for Edge Functions:

```bash
npx supabase secrets set OPENAI_API_KEY=<your-openai-api-key>
```

### 6. Run the Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
recipe-keeper/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth routes (login, signup)
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── recipes/          # Recipe-specific components
│   │   └── pdf/              # PDF generation components
│   ├── lib/                   # Utilities and configurations
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript types
├── supabase/
│   ├── migrations/            # Database migrations
│   └── functions/             # Edge Functions
├── cloudflare/
│   └── workers/               # Cloudflare Workers
├── public/                    # Static assets
└── docs/                      # Documentation
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run db:push` | Push database migrations |
| `npm run db:generate` | Generate migration from schema changes |

## Database Schema

See [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for detailed database documentation.

Key tables:
- `profiles` - User profiles
- `recipes` - Main recipe data
- `recipe_ingredients` - Ingredients list
- `recipe_steps` - Cooking instructions
- `recipe_images` - Finished dish photos
- `categories` - Recipe categories

## API Documentation

See [docs/API_SPEC.md](docs/API_SPEC.md) for Edge Functions and API documentation.

## Design System

See [docs/UI_DESIGN.md](docs/UI_DESIGN.md) for color palette, typography, and component specifications.

## Deployment

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

```bash
vercel deploy --prod
```

### Supabase

Database and Edge Functions are automatically synced when you push migrations:

```bash
npx supabase db push
npx supabase functions deploy
```

### Cloudflare Workers

```bash
cd cloudflare/workers
wrangler deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Backend powered by [Supabase](https://supabase.com)
- AI capabilities by [OpenAI](https://openai.com)
