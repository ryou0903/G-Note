/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Custom Midnight Blue Palette
                midnight: '#020617', // Slate 950
                surface: '#0f172a',  // Slate 900
                'surface-highlight': '#1e293b', // Slate 800
                primary: '#f8fafc',  // Slate 50
                secondary: '#94a3b8', // Slate 400
                accent: '#6366f1',   // Indigo 500
                border: '#1e293b',   // Slate 800
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
            typography: {
                DEFAULT: {
                    css: {
                        li: {
                            marginTop: '0.125em',
                            marginBottom: '0.125em',
                        },
                        'ul, ol': {
                            marginTop: '0.5em',
                            marginBottom: '0.5em',
                        },
                        'ul ul, ol ol, ul ol, ol ul': {
                            marginTop: '0.125em',
                            marginBottom: '0.125em',
                        },
                        p: {
                            marginTop: '0.625em',
                            marginBottom: '0.625em',
                        },
                        'h1, h2, h3, h4': {
                            marginTop: '1em',
                            marginBottom: '0.5em',
                        },
                    },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
