# UI Design System

## Overview

Recipe Keeper uses a warm, inviting design inspired by home kitchens and family cookbooks. The design system is built on peach tones with modern UI principles.

---

## Color Palette

### Primary Colors (Peach Tones)

```css
:root {
  /* Primary Peach */
  --peach-50: #FFF8F5;
  --peach-100: #FFEDE5;
  --peach-200: #FFE0D0;
  --peach-300: #FFCBA4;  /* Primary */
  --peach-400: #FFB88A;
  --peach-500: #FF9E66;
  --peach-600: #E5896B;
  --peach-700: #CC7052;
  --peach-800: #995540;
  --peach-900: #663A2D;
}
```

### Secondary Colors (Coral Accents)

```css
:root {
  --coral-50: #FFF5F2;
  --coral-100: #FFE8E2;
  --coral-200: #FFD4C9;
  --coral-300: #FFB5A3;
  --coral-400: #FF8B6A;  /* Accent */
  --coral-500: #E57257;
  --coral-600: #CC5E45;
  --coral-700: #994735;
  --coral-800: #663024;
  --coral-900: #331915;
}
```

### Neutral Colors

```css
:root {
  /* Warm Neutrals */
  --cream: #FFF8F0;        /* Page background */
  --warm-white: #FFFCFA;   /* Card backgrounds */
  --warm-gray-50: #FAF8F6;
  --warm-gray-100: #F5F0EB;
  --warm-gray-200: #E8E2DC;
  --warm-gray-300: #D4CCC4;
  --warm-gray-400: #A99E94;
  --warm-gray-500: #6B5B54;  /* Body text */
  --warm-gray-600: #524741;
  --warm-gray-700: #3D3532;  /* Headings */
  --warm-gray-800: #292422;
  --warm-gray-900: #1A1614;
}
```

### Semantic Colors

```css
:root {
  /* Success */
  --success-light: #E8F5E8;
  --success: #7CB97C;
  --success-dark: #4A8C4A;

  /* Warning */
  --warning-light: #FFF4E0;
  --warning: #E5B85C;
  --warning-dark: #B8923A;

  /* Error */
  --error-light: #FFEAEA;
  --error: #D97373;
  --error-dark: #B54545;

  /* Info */
  --info-light: #E8F2FA;
  --info: #7BA3C9;
  --info-dark: #5580A3;
}
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        peach: {
          50: '#FFF8F5',
          100: '#FFEDE5',
          200: '#FFE0D0',
          300: '#FFCBA4',
          400: '#FFB88A',
          500: '#FF9E66',
          600: '#E5896B',
          700: '#CC7052',
          800: '#995540',
          900: '#663A2D',
        },
        coral: {
          50: '#FFF5F2',
          100: '#FFE8E2',
          200: '#FFD4C9',
          300: '#FFB5A3',
          400: '#FF8B6A',
          500: '#E57257',
          600: '#CC5E45',
          700: '#994735',
          800: '#663024',
          900: '#331915',
        },
        cream: '#FFF8F0',
        'warm-white': '#FFFCFA',
        'warm-gray': {
          50: '#FAF8F6',
          100: '#F5F0EB',
          200: '#E8E2DC',
          300: '#D4CCC4',
          400: '#A99E94',
          500: '#6B5B54',
          600: '#524741',
          700: '#3D3532',
          800: '#292422',
          900: '#1A1614',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        script: ['Dancing Script', 'cursive'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

## Typography

### Font Families

1. **Playfair Display** (Headings)
   - Elegant serif typeface
   - Use for: h1, h2, recipe titles, book covers
   - Weights: 400, 500, 600, 700

2. **Inter** (Body)
   - Clean sans-serif for readability
   - Use for: paragraphs, labels, navigation
   - Weights: 400, 500, 600

3. **Dancing Script** (Accents)
   - Decorative script font
   - Use sparingly: dedications, special labels, "From Mom's Kitchen"
   - Weight: 400

### Type Scale

```css
/* Headings */
.text-h1 { @apply font-display text-4xl md:text-5xl font-semibold text-warm-gray-700; }
.text-h2 { @apply font-display text-3xl md:text-4xl font-semibold text-warm-gray-700; }
.text-h3 { @apply font-display text-2xl md:text-3xl font-medium text-warm-gray-700; }
.text-h4 { @apply font-display text-xl md:text-2xl font-medium text-warm-gray-700; }

/* Body */
.text-body-lg { @apply font-sans text-lg text-warm-gray-500; }
.text-body { @apply font-sans text-base text-warm-gray-500; }
.text-body-sm { @apply font-sans text-sm text-warm-gray-500; }

/* Labels */
.text-label { @apply font-sans text-sm font-medium text-warm-gray-600; }
.text-label-sm { @apply font-sans text-xs font-medium text-warm-gray-600 uppercase tracking-wide; }

/* Script */
.text-script { @apply font-script text-xl text-peach-600; }
```

---

## Spacing System

```css
/* Base: 4px */
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
--spacing-20: 5rem;    /* 80px */
```

---

## Component Specifications

### Cards

```tsx
// RecipeCard.tsx
<div className="
  bg-warm-white 
  rounded-2xl 
  shadow-sm 
  hover:shadow-md 
  transition-shadow 
  overflow-hidden
  border border-warm-gray-100
">
  {/* Image */}
  <div className="aspect-[4/3] bg-peach-100 relative">
    <Image src={imageUrl} alt={title} fill className="object-cover" />
  </div>
  
  {/* Content */}
  <div className="p-5">
    <h3 className="font-display text-xl text-warm-gray-700 mb-2">{title}</h3>
    <p className="text-warm-gray-400 text-sm mb-3">{description}</p>
    
    {/* Meta */}
    <div className="flex items-center gap-4 text-warm-gray-400 text-sm">
      <span className="flex items-center gap-1">
        <ClockIcon className="w-4 h-4" />
        {prepTime + cookTime} min
      </span>
      <span className="flex items-center gap-1">
        <UsersIcon className="w-4 h-4" />
        {servings}
      </span>
    </div>
  </div>
</div>
```

### Buttons

```tsx
// Primary Button
<button className="
  bg-peach-300 
  hover:bg-peach-400 
  text-warm-gray-700 
  font-medium 
  px-6 py-3 
  rounded-xl 
  transition-colors
  shadow-sm
">
  Save Recipe
</button>

// Secondary Button
<button className="
  bg-transparent 
  hover:bg-peach-50 
  text-peach-600 
  font-medium 
  px-6 py-3 
  rounded-xl 
  border-2 border-peach-300 
  transition-colors
">
  Cancel
</button>

// Ghost Button
<button className="
  text-warm-gray-500 
  hover:text-warm-gray-700 
  hover:bg-warm-gray-100 
  font-medium 
  px-4 py-2 
  rounded-lg 
  transition-colors
">
  View All
</button>

// Icon Button
<button className="
  w-10 h-10 
  rounded-full 
  flex items-center justify-center 
  bg-peach-100 
  hover:bg-peach-200 
  text-peach-600 
  transition-colors
">
  <HeartIcon className="w-5 h-5" />
</button>
```

### Form Inputs

```tsx
// Text Input
<div className="space-y-2">
  <label className="text-label">Recipe Title</label>
  <input 
    type="text"
    className="
      w-full 
      px-4 py-3 
      rounded-xl 
      border border-warm-gray-200 
      bg-warm-white
      text-warm-gray-700
      placeholder:text-warm-gray-400
      focus:outline-none 
      focus:ring-2 
      focus:ring-peach-300 
      focus:border-transparent
      transition-all
    "
    placeholder="Enter recipe title"
  />
</div>

// Select
<select className="
  w-full 
  px-4 py-3 
  rounded-xl 
  border border-warm-gray-200 
  bg-warm-white
  text-warm-gray-700
  focus:outline-none 
  focus:ring-2 
  focus:ring-peach-300 
  focus:border-transparent
">
  <option>Main Course</option>
  <option>Desserts</option>
</select>

// Textarea
<textarea className="
  w-full 
  px-4 py-3 
  rounded-xl 
  border border-warm-gray-200 
  bg-warm-white
  text-warm-gray-700
  placeholder:text-warm-gray-400
  focus:outline-none 
  focus:ring-2 
  focus:ring-peach-300 
  focus:border-transparent
  resize-none
  min-h-[120px]
"/>
```

### Navigation

```tsx
// Sidebar Navigation Item
<a className="
  flex items-center gap-3 
  px-4 py-3 
  rounded-xl 
  text-warm-gray-500 
  hover:bg-peach-50 
  hover:text-peach-600
  transition-colors
  [&.active]:bg-peach-100 
  [&.active]:text-peach-700
">
  <HomeIcon className="w-5 h-5" />
  <span>My Recipes</span>
</a>
```

### Badges & Tags

```tsx
// Category Badge
<span className="
  inline-flex items-center 
  px-3 py-1 
  rounded-full 
  bg-peach-100 
  text-peach-700 
  text-sm font-medium
">
  Desserts
</span>

// Source Tag
<span className="
  inline-flex items-center gap-1
  px-3 py-1 
  rounded-full 
  bg-coral-100 
  text-coral-600 
  text-sm
">
  <HeartIcon className="w-3 h-3" />
  From Mom
</span>

// Difficulty Badge
<span className="
  inline-flex items-center 
  px-2 py-0.5 
  rounded 
  bg-warm-gray-100 
  text-warm-gray-600 
  text-xs font-medium
">
  Easy
</span>
```

---

## Layout Components

### Page Container

```tsx
<div className="min-h-screen bg-cream">
  {/* Header */}
  <header className="bg-warm-white border-b border-warm-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="font-display text-2xl text-warm-gray-700">Recipe Keeper</span>
      </div>
      {/* Nav */}
    </div>
  </header>

  {/* Main */}
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {children}
  </main>
</div>
```

### Dashboard Layout

```tsx
<div className="flex min-h-screen bg-cream">
  {/* Sidebar */}
  <aside className="w-64 bg-warm-white border-r border-warm-gray-100 p-6">
    {/* Navigation */}
  </aside>

  {/* Content */}
  <div className="flex-1">
    <header className="h-16 bg-warm-white border-b border-warm-gray-100 px-6 flex items-center justify-between">
      {/* Search, User Menu */}
    </header>
    <main className="p-6">
      {children}
    </main>
  </div>
</div>
```

### Recipe Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {recipes.map(recipe => (
    <RecipeCard key={recipe.id} recipe={recipe} />
  ))}
</div>
```

---

## Shadows & Elevation

```css
/* Subtle shadow for cards */
.shadow-card {
  box-shadow: 0 1px 3px rgba(61, 53, 50, 0.08), 0 1px 2px rgba(61, 53, 50, 0.06);
}

/* Hover state */
.shadow-card-hover {
  box-shadow: 0 4px 6px rgba(61, 53, 50, 0.1), 0 2px 4px rgba(61, 53, 50, 0.06);
}

/* Modal/Dialog */
.shadow-modal {
  box-shadow: 0 20px 25px rgba(61, 53, 50, 0.15), 0 10px 10px rgba(61, 53, 50, 0.1);
}
```

---

## Border Radius

```css
--radius-sm: 0.5rem;   /* 8px - buttons, inputs */
--radius-md: 0.75rem;  /* 12px - cards */
--radius-lg: 1rem;     /* 16px - modals */
--radius-xl: 1.5rem;   /* 24px - large cards */
--radius-full: 9999px; /* pills, avatars */
```

---

## Animation & Transitions

```css
/* Default transition */
.transition-default {
  transition: all 0.2s ease-in-out;
}

/* Hover scale */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-2px);
}

/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## Responsive Breakpoints

```css
/* Mobile first */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

---

## Icons

Use **Lucide React** icons for consistency:

```tsx
import { 
  Home, 
  Book, 
  Heart, 
  Clock, 
  Users, 
  Plus,
  Search,
  Settings,
  Upload,
  Download,
  Trash2,
  Edit,
  Camera,
  ChefHat
} from 'lucide-react'

// Usage
<Home className="w-5 h-5 text-warm-gray-500" />
```

---

## Empty States

```tsx
<div className="text-center py-16">
  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-peach-100 flex items-center justify-center">
    <BookIcon className="w-10 h-10 text-peach-400" />
  </div>
  <h3 className="font-display text-xl text-warm-gray-700 mb-2">
    No recipes yet
  </h3>
  <p className="text-warm-gray-400 mb-6 max-w-sm mx-auto">
    Start building your family cookbook by adding your first recipe.
  </p>
  <Button>
    <Plus className="w-4 h-4 mr-2" />
    Add Recipe
  </Button>
</div>
```

---

## PDF Recipe Book Styling

```tsx
// PDF specific styles using @react-pdf/renderer
const pdfStyles = {
  page: {
    backgroundColor: '#FFF8F0',
    padding: 40,
  },
  title: {
    fontFamily: 'Playfair Display',
    fontSize: 28,
    color: '#3D3532',
    marginBottom: 12,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#6B5B54',
    lineHeight: 1.6,
  },
  ingredientList: {
    backgroundColor: '#FFEDE5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  stepNumber: {
    backgroundColor: '#FFCBA4',
    color: '#3D3532',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: '24px',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#A99E94',
  },
}
```

---

## Accessibility Guidelines

1. **Color Contrast**: All text meets WCAG 2.1 AA (4.5:1 for body, 3:1 for large text)
2. **Focus States**: Visible focus rings on all interactive elements
3. **Touch Targets**: Minimum 44x44px for touch targets
4. **Alt Text**: All images require descriptive alt text
5. **Keyboard Navigation**: Full keyboard support for all interactions
6. **Screen Readers**: Proper ARIA labels and semantic HTML
