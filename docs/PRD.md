# Product Requirements Document (PRD)
# Recipe Keeper - Family Recipe Digitalization App

## 1. Overview

### 1.1 Product Vision
Recipe Keeper is a web application designed to preserve and digitalize family recipes, ensuring cherished culinary traditions are never lost. Users can scan recipes from photos, PDFs, or handwritten notes, and the app uses AI to extract and structure the recipe data for easy storage and retrieval.

### 1.2 Problem Statement
Family recipes, especially those passed down from parents and grandparents, are often stored on handwritten cards, in old cookbooks, or only exist in memory. These precious culinary traditions risk being lost forever. Recipe Keeper solves this by providing an easy way to digitalize, organize, and preserve these recipes.

### 1.3 Target Users
- Home cooks wanting to preserve family recipes
- Children/grandchildren collecting recipes from parents/grandparents
- Anyone wanting to digitalize handwritten or printed recipe collections

---

## 2. Features & Requirements

### 2.1 Core Features

#### 2.1.1 User Authentication
- **Sign Up**: Email/password registration via Supabase Auth
- **Login**: Email/password authentication
- **Password Reset**: Email-based password recovery
- **Session Management**: Secure JWT-based sessions
- **Profile Management**: Update display name, avatar

#### 2.1.2 Recipe Scanning & Import
- **Image Upload**: Support for JPG, PNG, HEIC formats
- **PDF Upload**: Extract recipes from PDF documents
- **AI Analysis**: OpenAI Vision API extracts:
  - Recipe title
  - Ingredients list with quantities
  - Step-by-step instructions
  - Estimated prep/cook time
  - Serving size
- **Manual Review**: User can edit AI-extracted data before saving
- **Batch Import**: Upload multiple recipe images at once

#### 2.1.3 Recipe Management
- **Create Recipe**: Manual recipe entry form
- **Edit Recipe**: Modify any recipe field
- **Delete Recipe**: Soft delete with recovery option
- **Duplicate Recipe**: Clone recipe for variations
- **Archive Recipe**: Hide without deleting

#### 2.1.4 Recipe Details
- **Basic Info**:
  - Title (required)
  - Description
  - Servings count
  - Prep time
  - Cook time
  - Difficulty level (Easy, Medium, Hard)
- **Ingredients**:
  - Ingredient name
  - Quantity
  - Unit of measurement
  - Optional notes (e.g., "finely chopped")
- **Instructions**:
  - Numbered steps
  - Optional image per step
  - Optional timer per step
- **Images**:
  - 1-2 finished dish photos
  - Original scanned recipe image (preserved)
- **Metadata**:
  - Source (e.g., "Mom", "Grandma's cookbook", "Aunt Maria")
  - Date added
  - Last modified
  - Notes/memories associated with recipe

#### 2.1.5 Recipe Categorization
- **Categories**:
  - Appetizers/Starters
  - Main Course
  - Side Dishes
  - Desserts
  - Beverages
  - Breakfast
  - Snacks
  - Soups & Salads
- **Tags**: Custom user-defined tags
- **Favorites**: Mark recipes as favorites
- **Collections**: Group recipes into custom collections

#### 2.1.6 Recipe Book / PDF Export
- **Generate Recipe Book**: Create beautifully styled PDF
- **Customization Options**:
  - Select recipes to include
  - Choose cover design
  - Add personal dedication/intro
  - Select layout (single recipe per page, compact)
- **Styling**:
  - Professional typography
  - Recipe images included
  - Table of contents
  - Index by category
  - Page numbers
- **Export Formats**:
  - PDF (primary)
  - Print-ready format

#### 2.1.7 Search & Discovery
- **Full-text Search**: Search by title, ingredients, instructions
- **Filter Options**:
  - By category
  - By source
  - By difficulty
  - By cook time
  - By favorites
- **Sort Options**:
  - Alphabetical
  - Date added
  - Most recently used
  - Prep time

### 2.2 Non-Functional Requirements

#### 2.2.1 Performance
- Page load time < 2 seconds
- Image upload processing < 5 seconds
- AI recipe extraction < 15 seconds
- PDF generation < 30 seconds for 50 recipes

#### 2.2.2 Security
- All data encrypted in transit (HTTPS)
- Passwords hashed with bcrypt
- Row-level security (RLS) on all tables
- Users can only access their own recipes
- Secure file uploads with validation

#### 2.2.3 Scalability
- Support 10,000+ users
- Support 100+ recipes per user
- Optimized image storage and delivery

#### 2.2.4 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatible
- Color contrast ratios meet standards

---

## 3. Technical Architecture

### 3.1 Technology Stack

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **PDF Generation**: @react-pdf/renderer

#### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (images, PDFs)
- **Edge Functions**: Supabase Edge Functions (Deno)
- **CDN/Workers**: Cloudflare Workers (image optimization)

#### External Services
- **AI**: OpenAI API (GPT-4 Vision)
- **Analytics**: Vercel Analytics (optional)

### 3.2 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                     Next.js 14 App (React 18)                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers (CDN)                      │
│              - Image optimization & caching                      │
│              - Edge routing                                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Auth      │  │  Database   │  │  Storage                │ │
│  │             │  │ (PostgreSQL)│  │  - Recipe images        │ │
│  │ - Sign up   │  │             │  │  - Step images          │ │
│  │ - Login     │  │ - recipes   │  │  - Scanned originals    │ │
│  │ - Sessions  │  │ - steps     │  │  - User avatars         │ │
│  └─────────────┘  │ - images    │  └─────────────────────────┘ │
│                   │ - etc.      │                               │
│  ┌─────────────┐  └─────────────┘                               │
│  │Edge Functions│                                               │
│  │             │                                                │
│  │ - analyze-  │  ──────────────▶  OpenAI Vision API           │
│  │   recipe    │                                                │
│  │ - generate- │                                                │
│  │   pdf       │                                                │
│  └─────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. User Flows

### 4.1 New User Registration
1. User visits landing page
2. Clicks "Sign Up"
3. Enters email and password
4. Receives confirmation email
5. Clicks confirmation link
6. Redirected to dashboard (empty state)

### 4.2 Recipe Scanning Flow
1. User clicks "Add Recipe" → "Scan Recipe"
2. Uploads image/PDF of recipe
3. Loading state while AI processes
4. AI-extracted data displayed in editable form
5. User reviews and corrects any errors
6. Selects category and adds source
7. Optionally uploads finished dish photos
8. Clicks "Save Recipe"
9. Recipe appears in library

### 4.3 Manual Recipe Entry
1. User clicks "Add Recipe" → "Enter Manually"
2. Fills in recipe form (title, ingredients, steps)
3. Adds category and source
4. Uploads images (optional)
5. Saves recipe

### 4.4 Recipe Book Generation
1. User clicks "Create Recipe Book"
2. Selects recipes to include (checkboxes)
3. Chooses cover template
4. Adds optional dedication text
5. Previews book layout
6. Clicks "Generate PDF"
7. Downloads beautifully formatted recipe book

---

## 5. Design Specifications

### 5.1 Color Palette (Peach Tones)

```
Primary Colors:
- Peach:        #FFCBA4 (primary)
- Peach Light:  #FFE5D0 (backgrounds)
- Peach Dark:   #E5A882 (hover states)

Secondary Colors:
- Coral:        #FF8B6A (accents)
- Cream:        #FFF8F0 (page background)
- Warm Gray:    #6B5B54 (text)

Neutral Colors:
- White:        #FFFFFF
- Light Gray:   #F5F0EB
- Dark Gray:    #3D3532 (headings)

Semantic Colors:
- Success:      #7CB97C (green, muted)
- Warning:      #E5B85C (amber)
- Error:        #D97373 (soft red)
- Info:         #7BA3C9 (soft blue)
```

### 5.2 Typography
- **Headings**: Playfair Display (serif) - elegant, cookbook feel
- **Body**: Inter (sans-serif) - clean, readable
- **Accents**: Dancing Script (script) - for decorative elements

### 5.3 Design Principles
- Warm, inviting aesthetic reminiscent of home kitchens
- Generous whitespace for readability
- Card-based layout for recipe previews
- Soft shadows and rounded corners
- High-quality food photography emphasis
- Mobile-first responsive design

---

## 6. Success Metrics

### 6.1 Key Performance Indicators (KPIs)
- User registration rate
- Recipes created per user
- Recipe scan success rate (AI accuracy)
- PDF recipe books generated
- User retention (weekly/monthly active users)
- Average session duration

### 6.2 Quality Metrics
- AI extraction accuracy > 90%
- User-reported bugs < 5 per month
- Uptime > 99.5%

---

## 7. Future Considerations (Post-MVP)

- **Mobile Apps**: Native iOS/Android apps
- **Sharing**: Share recipes with family members
- **Collaboration**: Multiple users contribute to family cookbook
- **Meal Planning**: Weekly meal planner integration
- **Shopping Lists**: Generate shopping lists from recipes
- **Nutrition Info**: Auto-calculate nutritional information
- **Voice Control**: "Hey Recipe Keeper, what's in Mom's lasagna?"
- **Video Instructions**: Support for video recipe steps
- **Social Features**: Community recipe sharing (opt-in)

---

## 8. Timeline & Milestones

### Phase 1: Foundation (Week 1-2)
- Project setup and configuration
- Database schema implementation
- Authentication system
- Basic UI components

### Phase 2: Core Features (Week 3-4)
- Recipe CRUD operations
- Image upload and storage
- Category management
- Search and filtering

### Phase 3: AI Integration (Week 5)
- Supabase Edge Function for AI
- OpenAI Vision integration
- Recipe extraction pipeline

### Phase 4: PDF Export (Week 6)
- PDF template design
- Recipe book generation
- Download functionality

### Phase 5: Polish & Launch (Week 7-8)
- UI/UX refinements
- Performance optimization
- Testing and bug fixes
- Deployment

---

## 9. Appendix

### 9.1 Glossary
- **Recipe Scanning**: Process of uploading an image/PDF and using AI to extract recipe data
- **Recipe Book**: PDF compilation of selected recipes in a beautifully formatted book layout
- **Source**: Origin of a recipe (person, cookbook, website, etc.)
- **Edge Function**: Serverless function running on Supabase's edge network

### 9.2 References
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [shadcn/ui Components](https://ui.shadcn.com)
