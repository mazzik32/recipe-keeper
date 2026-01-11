import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			peach: {
  				'50': '#FFF8F5',
  				'100': '#FFEDE5',
  				'200': '#FFE0D0',
  				'300': '#FFCBA4',
  				'400': '#FFB88A',
  				'500': '#FF9E66',
  				'600': '#E5896B',
  				'700': '#CC7052',
  				'800': '#995540',
  				'900': '#663A2D'
  			},
  			coral: {
  				'50': '#FFF5F2',
  				'100': '#FFE8E2',
  				'200': '#FFD4C9',
  				'300': '#FFB5A3',
  				'400': '#FF8B6A',
  				'500': '#E57257',
  				'600': '#CC5E45',
  				'700': '#994735',
  				'800': '#663024',
  				'900': '#331915'
  			},
  			cream: '#FFF8F0',
  			'warm-white': '#FFFCFA',
  			'warm-gray': {
  				'50': '#FAF8F6',
  				'100': '#F5F0EB',
  				'200': '#E8E2DC',
  				'300': '#D4CCC4',
  				'400': '#A99E94',
  				'500': '#6B5B54',
  				'600': '#524741',
  				'700': '#3D3532',
  				'800': '#292422',
  				'900': '#1A1614'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			display: [
  				'var(--font-playfair)',
  				'serif'
  			],
  			sans: [
  				'var(--font-inter)',
  				'system-ui',
  				'sans-serif'
  			],
  			script: [
  				'var(--font-dancing)',
  				'cursive'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
