/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                peach: {
                    50: '#fdf6f3',
                    100: '#f9e9e1',
                    200: '#f5d5c6',
                    300: '#f8a888',
                    400: '#f28b63',
                    500: '#eb6e3e',
                    600: '#dd5522',
                },
                'warm-gray': {
                    100: '#f5f4f3',
                    200: '#eaeaeb',
                    400: '#b8b5b2',
                    500: '#999591',
                    600: '#75716d',
                    700: '#3d3632',
                },
                'warm-white': '#fbfaf9',
                cream: '#faf9f6',
                'cream-dark': '#f5f3ef',
            }
        },
    },
    plugins: [],
}
