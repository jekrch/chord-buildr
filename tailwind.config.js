/** @type {import('tailwindcss').Config} */
import tailwindAnimate from "tailwindcss-animate"

export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		/*
  			dialog enter/exit. plain opacity + transform with no css variables
  			so the browser can run them on the compositor; the tailwindcss-animate
  			keyframes read variables, which can keep them on the main thread where
  			a busy frame (scroll lock relayout, a board rebuild) swallows them.
  			the content keyframes carry the -50% centering translate themselves
  		*/
  		keyframes: {
  			'dialog-overlay-in': {
  				from: { opacity: '0' },
  				to: { opacity: '1' }
  			},
  			'dialog-overlay-out': {
  				from: { opacity: '1' },
  				to: { opacity: '0' }
  			},
  			'dialog-content-in': {
  				from: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' },
  				to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' }
  			},
  			'dialog-content-out': {
  				from: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
  				to: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' }
  			}
  		},
  		// same curve and exit length as utils/chordTransitions.ts
  		animation: {
  			'dialog-overlay-in': 'dialog-overlay-in 220ms cubic-bezier(0.22, 1, 0.36, 1) backwards',
  			'dialog-overlay-out': 'dialog-overlay-out 180ms ease-in forwards',
  			'dialog-content-in': 'dialog-content-in 220ms cubic-bezier(0.22, 1, 0.36, 1) backwards',
  			'dialog-content-out': 'dialog-content-out 180ms ease-in forwards'
  		},
  		fontFamily: {
  			sans: ['ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif']
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
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
  			well: 'hsl(var(--well))',
  			playing: 'hsl(var(--playing))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  plugins: [tailwindAnimate],
}