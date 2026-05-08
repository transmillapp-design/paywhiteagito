/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                colors: {
                        // AGITOMIL - Verde-Oliva, Dourado, Cinza
                        agitomil: {
                                olive: '#556B2F',
                                'olive-light': '#6B8239',
                                'olive-dark': '#3F5123',
                                'olive-darker': '#2A3618',
                                gray: '#4B4B4B',
                                'gray-light': '#6B6B6B',
                                'gray-medium': '#8B8B8B',
                                'gray-lighter': '#ABABAB',
                                gold: '#D4AF37',
                                'gold-light': '#E5C34A',
                                'gold-dark': '#B89B2F',
                                silver: '#C0C0C0',
                                black: '#1A1A1A',
                        },
                        // TRANSMILL - Nova paleta de cores
                        transmill: {
                                // MODO CLARO
                                'blue': '#005B9C',        // Primário claro
                                'silver': '#EEEEEE',      // Secundário claro
                                // MODO ESCURO
                                'dark-green': '#293618',  // Primário escuro
                                'olive': '#005B9C',       // Agora aponta para azul (modo claro)
                                'mustard': '#CEAE31',     // Secundário escuro (destaques)
                                // Novas cores para modo claro
                                'olive-light': '#0077CC',
                                'olive-dark': '#004A7C',
                                'olive-darker': '#003366',
                                gray: '#666666',
                                gold: '#005B9C',          // Agora aponta para azul
                                'gold-light': '#0077CC',
                                'gold-dark': '#004A7C',
                        },
                        // Legacy (manter compatibilidade temporária)
                        agito: {
                                primary: '#C9A961',
                                text: {
                                        light: '#D4D4D4',
                                        dark: '#C9A961',
                                },
                                card: {
                                        light: '#4A3F35',
                                        dark: '#2A2520',
                                }
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
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'spin-slow': 'spin 3s linear infinite'
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};