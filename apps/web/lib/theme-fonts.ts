import {
  Fraunces,
  Manrope,
  Newsreader,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Source_Sans_3,
} from 'next/font/google';

/** Self-hosted per theme — never load all six families on one route. */

export const fontGiftDisplay = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-gift-display',
  weight: ['500', '700'],
});

export const fontGiftBody = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-gift-body',
  weight: ['400', '500', '600'],
});

export const fontBlogDisplay = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-blog-display',
  weight: ['500', '700'],
  adjustFontFallback: false,
});

export const fontBlogBody = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-blog-body',
  weight: ['400', '500', '600'],
});

export const fontCreatorDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-creator-display',
  weight: ['500', '700'],
});

export const fontCreatorBody = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-creator-body',
  weight: ['400', '500', '600'],
});

export const giftFontClass = `${fontGiftDisplay.variable} ${fontGiftBody.variable}`;
export const blogFontClass = `${fontBlogDisplay.variable} ${fontBlogBody.variable}`;
export const creatorFontClass = `${fontCreatorDisplay.variable} ${fontCreatorBody.variable}`;
