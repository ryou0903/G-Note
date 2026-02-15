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
                        // Base line-height: match textarea's leading-normal (1.5)
                        lineHeight: '1.5',
                        // Spacing
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
                            marginTop: '0.4em',
                            marginBottom: '0.4em',
                        },
                        // Headings - Obsidian-style hierarchy
                        h1: {
                            fontSize: '1.75em',
                            fontWeight: '700',
                            marginTop: '1.2em',
                            marginBottom: '0.4em',
                            paddingBottom: '0.3em',
                            borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
                        },
                        h2: {
                            fontSize: '1.4em',
                            fontWeight: '600',
                            marginTop: '1.0em',
                            marginBottom: '0.4em',
                            paddingBottom: '0.25em',
                            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                        },
                        h3: {
                            fontSize: '1.15em',
                            fontWeight: '600',
                            marginTop: '0.75em',
                            marginBottom: '0.3em',
                        },
                        h4: {
                            fontSize: '1em',
                            fontWeight: '600',
                            marginTop: '0.75em',
                            marginBottom: '0.3em',
                        },
                        // Blockquote - Obsidian-style left border
                        blockquote: {
                            borderLeftWidth: '3px',
                            borderLeftColor: '#6366f1',
                            backgroundColor: 'rgba(99, 102, 241, 0.05)',
                            borderRadius: '0 4px 4px 0',
                            paddingTop: '0.5em',
                            paddingBottom: '0.5em',
                            paddingLeft: '1em',
                            paddingRight: '1em',
                            fontStyle: 'normal',
                            quotes: 'none',
                        },
                        'blockquote p': {
                            fontStyle: 'italic',
                        },
                        'blockquote p:first-of-type::before': {
                            content: 'none',
                        },
                        'blockquote p:last-of-type::after': {
                            content: 'none',
                        },
                        // HR - subtle divider
                        hr: {
                            borderColor: 'rgba(148, 163, 184, 0.15)',
                            marginTop: '1.0em',
                            marginBottom: '1.0em',
                        },
                        // Inline code
                        code: {
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            padding: '0.15em 0.4em',
                            borderRadius: '4px',
                            fontWeight: '400',
                            fontSize: '0.875em',
                        },
                        'code::before': {
                            content: 'none',
                        },
                        'code::after': {
                            content: 'none',
                        },
                        // Code blocks
                        pre: {
                            backgroundColor: '#0f172a',
                            borderRadius: '8px',
                            border: '1px solid rgba(148, 163, 184, 0.1)',
                        },
                        'pre code': {
                            backgroundColor: 'transparent',
                            padding: '0',
                            borderRadius: '0',
                        },
                        // Links
                        a: {
                            color: '#818cf8',
                            textDecoration: 'none',
                            '&:hover': {
                                textDecoration: 'underline',
                            },
                        },
                        // Strong
                        strong: {
                            fontWeight: '600',
                        },
                    },
                },
                invert: {
                    css: {
                        '--tw-prose-body': '#cbd5e1',
                        '--tw-prose-headings': '#f1f5f9',
                        '--tw-prose-bold': '#f8fafc',
                        '--tw-prose-links': '#818cf8',
                        '--tw-prose-code': '#e2e8f0',
                        '--tw-prose-quotes': '#cbd5e1',
                        '--tw-prose-quote-borders': '#6366f1',
                        '--tw-prose-hr': 'rgba(148, 163, 184, 0.15)',
                        '--tw-prose-counters': '#94a3b8',
                        '--tw-prose-bullets': '#94a3b8',
                        '--tw-prose-th-borders': 'rgba(148, 163, 184, 0.2)',
                        '--tw-prose-td-borders': 'rgba(148, 163, 184, 0.1)',
                    },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
