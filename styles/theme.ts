/**
 * RapidTakeoff Theme Configuration
 * 
 * This file contains all theme-related constants and styles for the application.
 * Use these values throughout the app to maintain consistent styling.
 */

// Core color palette based on Material Design principles
export const colors = {
  // Primary brand colors - Muted Navy
  primary: {
    light: '#3F4D68',    // Muted Light Navy
    main: '#1E2A45',     // Muted Navy
    dark: '#0E1729',     // Very Dark Muted Navy
    container: '#E0E3EB', // Light Navy background for containers
    onContainer: '#0E1729', // Dark text for primary containers
  },
  
  // Secondary/accent colors - Muted Sage
  secondary: {
    light: '#B7BFA3',     // Light Muted Sage
    main: '#8A9576',     // Muted Sage
    dark: '#5C664D',     // Dark Muted Sage
    container: '#EBEEE7', // Light Sage background for containers
    onContainer: '#3E4434', // Dark text for secondary containers
  },
  
  // Tertiary colors - Muted Gold
  tertiary: {
    light: '#D6BC85',     // Light Muted Gold
    main: '#B29759',     // Muted Gold
    dark: '#8C7544',     // Dark Muted Gold
    container: '#F4EFDF', // Light Gold background for containers
    onContainer: '#5E4D2E', // Dark text for tertiary containers
  },
  
  // Error colors
  error: {
    light: '#FCA5A5',     // Red 300
    main: '#EF4444',     // Red 500
    dark: '#B91C1C',     // Red 700
    container: '#FEF2F2', // Light red background for error containers
    onContainer: '#991B1B', // Dark text for error containers
  },
  
  // Neutral colors for backgrounds, text, etc.
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
  },
  
  // On colors (text/icon colors to use on backgrounds)
  onPrimary: '#FFFFFF',    // White text on primary color
  onSecondary: '#FFFFFF',  // White text on secondary color
  onTertiary: '#FFFFFF',   // White text on tertiary color
  onError: '#FFFFFF',      // White text on error color
  onBackground: '#111827', // Dark text on background
  onSurface: '#111827',    // Dark text on surface
  
  // Surfaces
  surface: {
    main: '#FFFFFF',        // Main surface color
    dim: '#F9FAFB',         // Dimmed surface
    bright: '#FFFFFF',      // Bright surface
    container: '#F3F4F6',   // Container surface
    variant: '#E5E7EB',     // Variant surface
  },
  
  // Background
  background: {
    main: '#FFFFFF',
    dim: '#F9FAFB',
    canvas: '#FFFFFF',
    
    // Semantic background areas
    sidebar: '#1E2A45',     // Using primary.main color for sidebar
    dialog: '#FFFFFF',      // White for dialog backgrounds
    tooltip: '#1F2937',     // Dark background for tooltips
    menu: '#FFFFFF',        // White for menu backgrounds
    // Overlay background (e.g., for modals)
    overlay: 'rgba(0, 0, 0, 0.5)',
  }
};

// Typography settings
export const typography = {
  fontFamily: {
    sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    none: '1',
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
    loose: '2',
  }
};

// Spacing (padding, margin, gap) scales
export const spacing = {
  px: '1px',
  0: '0px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
  40: '10rem',
  48: '12rem',
};

// Size values for width, height, etc.
export const sizes = {
  // Fixed sizes
  sidebar: {
    width: '240px',
    collapsedWidth: '64px'
  },
  header: {
    height: '64px'
  },
  // Percentage-based sizes
  full: '100%',
  half: '50%',
  third: '33.333333%',
  quarter: '25%',
  // Responsive breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
};

// Border radii
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',
  md: '0.25rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

// Animation & transition settings
export const animation = {
  durations: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  easings: {
    ease: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
    easeIn: 'cubic-bezier(0.42, 0, 1.0, 1.0)',
    easeOut: 'cubic-bezier(0, 0, 0.58, 1.0)',
    easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1.0)',
  },
};

// SVG renderer settings
export const svgRenderer = {
  default: {
    lineWidth: 0.5,
    backgroundColor: colors.surface.main,
    lineColor: colors.neutral.black,
    textColor: colors.neutral.black,
    debug: false,
  },
  variants: {
    thin: {
      lineWidth: 0.3,
    },
    bold: {
      lineWidth: 1.0,
    },
    colorful: {
      lineColor: colors.primary.main,
      textColor: colors.secondary.main,
    },
    darkMode: {
      backgroundColor: colors.neutral.gray900,
      lineColor: colors.neutral.white,
      textColor: colors.neutral.white,
    }
  }
};

// Z-index layers
export const zIndex = {
  base: 0,
  content: 10,
  sidebar: 20,
  overlay: 30,
  modal: 40,
  tooltip: 50,
  toast: 60,
};

// Component-specific themes
export const components = {
  button: {
    primary: {
      // Use theme primary colors for button background and hover
      backgroundColor: colors.primary.main,
      hoverBackgroundColor: colors.primary.dark,
      textColor: colors.onPrimary,
      borderRadius: borderRadius.md,
      padding: `${spacing[2]} ${spacing[4]}`,
    },
    secondary: {
      // Use theme secondary colors for button background and hover
      backgroundColor: colors.secondary.main,
      hoverBackgroundColor: colors.secondary.dark,
      textColor: colors.onSecondary,
      borderRadius: borderRadius.md,
      padding: `${spacing[2]} ${spacing[4]}`,
    },
    tertiary: {
      // Use theme tertiary colors for button background and hover
      backgroundColor: colors.tertiary.main,
      hoverBackgroundColor: colors.tertiary.dark,
      textColor: colors.onTertiary,
      borderRadius: borderRadius.md,
      padding: `${spacing[2]} ${spacing[4]}`,
    },
  },
  sidebar: {
    backgroundColor: colors.background.sidebar,
    textColor: colors.onPrimary,
    width: sizes.sidebar.width,
    // Background for selected sidebar items
    activeItemBackground: 'rgba(255, 255, 255, 0.2)',
    // Default background for sidebar items
    itemBackground: 'rgba(255, 255, 255, 0.1)',
  },
  canvas: {
    backgroundColor: colors.background.canvas,
    borderColor: colors.neutral.gray300,
    shadow: shadows.md,
  }
};

// Export theme as a complete object
export const theme = {
  colors,
  typography,
  spacing,
  sizes,
  borderRadius,
  shadows,
  animation,
  svgRenderer,
  zIndex,
  components,
};

export default theme;