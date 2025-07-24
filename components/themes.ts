import * as THREE from "three";

// Type definitions for our theme system
export interface BlockColorGenerator {
  (index: number, colorOffset: number): THREE.Color | number;
}

export interface GameTheme {
  id: string;
  name: string;
  backgroundColor: string;
  scoreTextColor: string;
  messageTextColor: string;
  generateBlockColor: BlockColorGenerator;
  // Optional: theme-specific properties
  description?: string;
  unlocked?: boolean;
  price?: number;
}

// Block color generators for different themes
const generateRainbowColor: BlockColorGenerator = (
  index: number,
  colorOffset: number
) => {
  if (index === 1) {
    return 0x333344; // First block is always dark
  }

  const offset = index + colorOffset;
  // Much more vibrant colors with higher amplitude and lower base values
  const r = Math.sin(0.3 * offset) * 127 + 128; // Range: 1-255
  const g = Math.sin(0.3 * offset + 2.1) * 127 + 128; // Range: 1-255
  const b = Math.sin(0.3 * offset + 4.2) * 127 + 128; // Range: 1-255
  return new THREE.Color(r / 255, g / 255, b / 255);
};

const generateMonochromeGrayColor: BlockColorGenerator = (
  index: number,
  colorOffset: number
) => {
  if (index === 1) {
    return 0x1a1a1a; // Darker gray foundation for better contrast
  }

  // Generate different shades of gray with more contrast
  const offset = index + colorOffset;
  const grayValue = Math.sin(0.2 * offset) * 0.4 + 0.6; // 0.2 to 1.0 range (higher contrast)
  return new THREE.Color(grayValue, grayValue, grayValue);
};

const generateMonochromeBlueColor: BlockColorGenerator = (
  index: number,
  colorOffset: number
) => {
  if (index === 1) {
    return 0x0d47a1; // Brighter blue foundation
  }

  const offset = index + colorOffset;
  const intensity = Math.sin(0.2 * offset) * 0.5 + 0.5; // 0.0 to 1.0 range
  // More saturated blues with higher contrast
  return new THREE.Color(0.1 * intensity, 0.4 * intensity, 1.0 * intensity);
};

const generateMagmaColor: BlockColorGenerator = (
  index: number,
  colorOffset: number
) => {
  if (index === 1) {
    return 0x333000; // Darker red foundation for better contrast
  }

  const offset = index + colorOffset;
  const cycle = Math.sin(0.25 * offset) * 0.5 + 0.5; // 0 to 1

  if (cycle < 0.33) {
    // Dark red to bright red - more saturated
    const intensity = cycle * 3;
    return new THREE.Color(0.3 + intensity * 0.7, 0.0, 0.0); // Pure reds
  } else if (cycle < 0.66) {
    // Red to orange - more vibrant
    const intensity = (cycle - 0.33) * 3;
    return new THREE.Color(1, intensity * 0.6, 0.0); // Bright red-oranges
  } else {
    // Orange to yellow - more intense
    const intensity = (cycle - 0.66) * 3;
    return new THREE.Color(1, 0.6 + intensity * 0.4, intensity * 0.4); // Bright yellows
  }
};

const generateCandyColor: BlockColorGenerator = (
  index: number,
  colorOffset: number
) => {
  if (index === 1) {
    return 0x6a1b9a; // More vibrant purple foundation
  }

  const offset = index + colorOffset;
  // More saturated candy colors
  const colors = [
    new THREE.Color(1, 0.2, 0.8), // Bright hot pink
    new THREE.Color(0.9, 0.1, 1), // Vibrant purple
    new THREE.Color(0.1, 0.9, 1), // Electric cyan
    new THREE.Color(0.2, 1, 0.4), // Bright mint green
    new THREE.Color(1, 0.7, 0.0), // Vivid orange
    new THREE.Color(1, 0.1, 0.9), // Electric magenta
  ];

  return colors[offset % colors.length];
};

const generateOceanColor: BlockColorGenerator = (
  index: number,
  colorOffset: number
) => {
  if (index === 1) {
    return 0x001133; // Deeper ocean foundation
  }

  const offset = index + colorOffset;
  const wave = Math.sin(0.3 * offset) * 0.5 + 0.5;

  // More saturated blues and teals
  const r = 0.0 + wave * 0.3; // Range: 0.0-0.3 (minimal red)
  const g = 0.4 + wave * 0.5; // Range: 0.4-0.9 (medium-high green)
  const b = 0.7 + wave * 0.3; // Range: 0.7-1.0 (high blue)

  return new THREE.Color(r, g, b);
};

const generateSunsetColor: BlockColorGenerator = (idx, offset) => {
  const vibrantSunset = [
    0xeeaf61, // warm yellow‑gold
    0xfb9062, // bright orange‑coral
    0xee5d6c, // punchy rose‑red
    0xce4993, // magenta‑pink
    0x6a0d83, // deep purple
  ];

  if (idx === 1) return new THREE.Color(0x4a148c); // Dark purple foundation for better contrast

  // 0→1 cycle
  const cycle = (Math.sin(0.2 * (idx + offset)) + 1) / 2;

  // map onto [0 .. N-1]
  const N = vibrantSunset.length;
  const scaled = cycle * (N - 1);
  const base = Math.floor(scaled);
  const f = scaled - base;

  // pick two stops
  const c1 = new THREE.Color(vibrantSunset[base]);
  const c2 = new THREE.Color(vibrantSunset[Math.min(base + 1, N - 1)]);

  // lerp between them
  return c1.lerp(c2, f);
};

// Define all available themes
export const AVAILABLE_THEMES: { [key: string]: GameTheme } = {
  classic: {
    id: "classic",
    name: "Classic Rainbow",
    backgroundColor: "#D0CBC7",
    scoreTextColor: "#333333",
    messageTextColor: "#333333",
    generateBlockColor: generateRainbowColor,
    description: "The original colorful rainbow theme",
    unlocked: true,
    price: 0,
  },

  monochrome_gray: {
    id: "monochrome_gray",
    name: "Monochrome Gray",
    backgroundColor: "#E8E8E8",
    scoreTextColor: "#2a2a2a",
    messageTextColor: "#2a2a2a",
    generateBlockColor: generateMonochromeGrayColor,
    description: "Elegant grayscale blocks",
    unlocked: false,
    price: 50,
  },

  monochrome_blue: {
    id: "monochrome_blue",
    name: "Ocean Depths",
    backgroundColor: "#E3F2FD",
    scoreTextColor: "#1a237e",
    messageTextColor: "#1a237e",
    generateBlockColor: generateMonochromeBlueColor,
    description: "Cool blue tones",
    unlocked: false,
    price: 75,
  },

  magma: {
    id: "magma",
    name: "Molten Magma",
    backgroundColor: "#1a0000",
    scoreTextColor: "#ff6b35",
    messageTextColor: "#ff6b35",
    generateBlockColor: generateMagmaColor,
    description: "Fiery reds and oranges",
    unlocked: false,
    price: 100,
  },

  candy: {
    id: "candy",
    name: "Candy Land",
    backgroundColor: "#fce4ec",
    scoreTextColor: "#4a148c",
    messageTextColor: "#4a148c",
    generateBlockColor: generateCandyColor,
    description: "Sweet and vibrant colors",
    unlocked: false,
    price: 125,
  },

  ocean: {
    id: "ocean",
    name: "Ocean Waves",
    backgroundColor: "#e0f2f1",
    scoreTextColor: "#004d40",
    messageTextColor: "#004d40",
    generateBlockColor: generateOceanColor,
    description: "Calming ocean blues and teals",
    unlocked: false,
    price: 150,
  },

  sunset: {
    id: "sunset",
    name: "Sunset Sky",
    backgroundColor: "#fce4ec",
    scoreTextColor: "#4a148c",
    messageTextColor: "#4a148c",
    generateBlockColor: generateSunsetColor,
    description: "Beautiful sunset gradient",
    unlocked: false,
    price: 200,
  },
};

// Current active theme (can be changed by the shop system later)
export let CURRENT_THEME: GameTheme = AVAILABLE_THEMES.classic;

// Function to switch themes (will be used by the shop system)
export const setCurrentTheme = (themeId: string): boolean => {
  const theme = AVAILABLE_THEMES[themeId];
  if (theme && theme.unlocked) {
    CURRENT_THEME = theme;
    return true;
  }
  return false;
};

// Function to unlock a theme (will be used by the shop system)
export const unlockTheme = (themeId: string): boolean => {
  const theme = AVAILABLE_THEMES[themeId];
  if (theme) {
    theme.unlocked = true;
    return true;
  }
  return false;
};

// Convenience functions for accessing current theme properties
export const getCurrentBackgroundColor = (): string =>
  CURRENT_THEME.backgroundColor;
export const getCurrentScoreColor = (): string => CURRENT_THEME.scoreTextColor;
export const getCurrentMessageColor = (): string =>
  CURRENT_THEME.messageTextColor;
export const generateCurrentBlockColor = (
  index: number,
  colorOffset: number
): THREE.Color | number => {
  return CURRENT_THEME.generateBlockColor(index, colorOffset);
};

// Function to get all unlocked themes (for theme selection UI)
export const getUnlockedThemes = (): GameTheme[] => {
  return Object.values(AVAILABLE_THEMES).filter((theme) => theme.unlocked);
};

// Function to get all locked themes (for shop UI)
export const getLockedThemes = (): GameTheme[] => {
  return Object.values(AVAILABLE_THEMES).filter((theme) => !theme.unlocked);
};
