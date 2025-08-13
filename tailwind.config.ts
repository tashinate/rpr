
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		screens: {
			'xs': '475px',
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
		},
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'xs': '475px',
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			fontFamily: {
				'inter': ['Inter Display', 'Inter', 'sans-serif'],
				'jetbrains': ['JetBrains Mono', 'monospace'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'bounce-sm': {
					'0%, 100%': {
						transform: 'translateY(-4%)',
						animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)'
					},
					'50%': {
						transform: 'translateY(0)',
						animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)'
					}
				},
				'pulse-subtle': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.85' }
				},
				'pulse-slow': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' }
				},
				shimmer: {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				glow: {
					'0%, 100%': { opacity: '0.8' },
					'50%': { opacity: '0.4' }
				},
				'gradient-flow': {
					'0%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' },
					'100%': { backgroundPosition: '0% 50%' }
				},
				'float-1': {
					'0%, 100%': { transform: 'translate(0px, 0px) rotate(0deg)' },
					'33%': { transform: 'translate(30px, -30px) rotate(120deg)' },
					'66%': { transform: 'translate(-20px, 20px) rotate(240deg)' }
				},
				'float-2': {
					'0%, 100%': { transform: 'translate(0px, 0px) rotate(0deg)' },
					'33%': { transform: 'translate(-30px, 30px) rotate(-120deg)' },
					'66%': { transform: 'translate(20px, -20px) rotate(-240deg)' }
				},
				'scan-line': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100vw)' }
				},
				'radar-pulse': {
					'0%': { transform: 'scale(0)', opacity: '1' },
					'100%': { transform: 'scale(4)', opacity: '0' }
				},
				'alien-float': {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
					'50%': { transform: 'translateY(-8px) rotate(2deg)' }
				},
				'alien-glow': {
					'0%, 100%': { 
						filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6)) hue-rotate(0deg)',
						transform: 'scale(1)'
					},
					'50%': { 
						filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.9)) hue-rotate(90deg)',
						transform: 'scale(1.1)'
					}
				},
				'alien-breathe': {
					'0%, 100%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.05)' }
				},
				'wave-letter': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'25%': { transform: 'translateY(-4px)' },
					'75%': { transform: 'translateY(2px)' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'bounce-sm': 'bounce-sm 2s infinite',
				'pulse-subtle': 'pulse-subtle 3s infinite',
				'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
				'shimmer': 'shimmer 8s ease-in-out infinite',
				'glow': 'glow 3s ease-in-out infinite',
				'gradient-flow': 'gradient-flow 15s ease-in-out infinite',
				'float-1': 'float-1 20s ease-in-out infinite',
				'float-2': 'float-2 25s ease-in-out infinite',
				'scan-line': 'scan-line 8s linear infinite',
				'radar-pulse': 'radar-pulse 3s ease-out infinite',
				'alien-float': 'alien-float 3s ease-in-out infinite',
				'alien-glow': 'alien-glow 4s ease-in-out infinite',
				'alien-breathe': 'alien-breathe 2s ease-in-out infinite',
				'wave-letter': 'wave-letter 2s ease-in-out infinite',
				'fade-in': 'fade-in 0.5s ease-in-out forwards'
			},
			backgroundImage: {
				'grid-slate-700': 'linear-gradient(to right, #64748b10 1px, transparent 1px), linear-gradient(to bottom, #64748b10 1px, transparent 1px)',
			},
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		function({ addUtilities }: { addUtilities: Function }) {
			const newUtilities = {
				'.mask-fade-out': {
					'mask-image': 'linear-gradient(to bottom, rgba(0, 0, 0, 1.0) 80%, transparent 100%)',
				},
			}
			addUtilities(newUtilities)
		},
	],
} satisfies Config;
