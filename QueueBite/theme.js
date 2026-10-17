// ==========================================================================
// QueueBite Tailwind CSS Configuration
// Theme: "Cocoa and cream"
// Edit colours here to update the entire look and feel across all pages.
// ==========================================================================

tailwind.config = {
  theme: {
    extend: {
      colors: {
        // Main Cocoa shades
        primary: {
          DEFAULT: '#8B5E3C', // Main cocoa brown for buttons, active tabs & headers
          dark: '#6F4A2E',    // Darker cocoa for hover/active click states
          light: '#F1E6D8',   // Light cream/tan for soft badges & card fills
        },
        // Mustard / Golden Accent for highlights, badges & ratings
        accent: {
          DEFAULT: '#E9A23B',
          dark: '#CE8623',
        },
        // App background colour (soft warm cream)
        cream: '#FBF4E9',
        // Deep espresso text colours
        ink: {
          DEFAULT: '#2F2118', // Primary readable text
          muted: '#6E584B',   // Subtitles, helper text
          subtle: '#A89689',  // Borders, inactive states, placeholders
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        // Soft elevation shadows for mobile cards
        'card': '0 4px 20px -2px rgba(47, 33, 24, 0.07)',
        'card-hover': '0 8px 26px -4px rgba(47, 33, 24, 0.12)',
        'button': '0 6px 18px -2px rgba(139, 94, 60, 0.35)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        gentlePulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.03)' },
        }
      },
      animation: {
        float: 'float 3.5s ease-in-out infinite',
        'pulse-subtle': 'gentlePulse 2.5s ease-in-out infinite',
      }
    }
  }
};
