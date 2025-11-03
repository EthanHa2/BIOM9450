"use client";

import { Button, createTheme, MantineColorsTuple, rem } from '@mantine/core';

const createColorSwatch = (colorVar: string): MantineColorsTuple => [
  colorVar, // 0
  colorVar, // 1
  colorVar, // 2
  colorVar, // 3
  colorVar, // 4
  colorVar, // 5
  colorVar, // 6 (default shade)
  colorVar, // 7
  colorVar, // 8
  colorVar, // 9
];

export const theme = createTheme({
  fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui',
  fontFamilyMonospace: 'var(--font-geist-mono), ui-monospace, monospace',

  headings: {
    fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: rem(40), lineHeight: '1.1' },
      h2: { fontSize: rem(32), lineHeight: '1.15' },
      h3: { fontSize: rem(28), lineHeight: '1.2' },
    },
  },
  white: 'var(--background)',
  black: 'var(--foreground)',

  colors: {
    'primary': createColorSwatch('var(--theme-primary)'),
    'secondary': createColorSwatch('var(--theme-secondary)'),
  },

  primaryColor: 'primary',

  components: {
    Paper: {
      styles: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
    Header: {
      styles: {
        root: {
          backgroundColor: 'transparent',
          borderColor: 'var(--border)',
        },
      },
    },
    Button: Button.extend({
      styles: (theme, props) => ({
        root: {
          ...(props.variant === 'filled' &&
            (props.color === 'primary') && {
              color: 'var(--theme-primary-foreground)',
            }),

          ...(props.variant === 'filled' &&
            props.color === 'secondary' && {
              color: 'var(--theme-secondary-foreground)',
            }),
        },
      }),
    }),
  },
});