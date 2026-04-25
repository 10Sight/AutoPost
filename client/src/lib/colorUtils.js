/**
 * Utility functions for color manipulation and theme coordination.
 * Focused on production performance and reliability.
 */

/**
 * Converts a hex color to its RGB components.
 * Returns a string formatted for CSS variable usage: "r, g, b"
 */
export const hexToRgbValues = (hex) => {
    if (!hex) return null;
    
    // Normalize hex
    let cleanHex = hex.replace("#", "");
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split("").map(c => c + c).join("");
    }
    
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    
    return `${r}, ${g}, ${b}`;
};

/**
 * Calculates the best readable contrast color (white or black) for a given background hex.
 * Uses the HSP color model for human-perceived brightness.
 */
export const getContrastColor = (hex) => {
    if (!hex) return "255, 255, 255"; // Default white foreground
    
    let cleanHex = hex.replace("#", "");
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split("").map(c => c + c).join("");
    }
    
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    // HSP equation from http://alienryderflex.com/hsp.html
    const hsp = Math.sqrt(
        0.299 * (r * r) +
        0.587 * (g * g) +
        0.114 * (b * b)
    );

    // If HSP is greater than 127.5, the color is light, so use black text.
    // Otherwise, use white text.
    return hsp > 155 ? "0, 0, 0" : "255, 255, 255";
};

/**
 * Validates if a string is a valid 3 or 6 digit hex color.
 */
export const isValidHex = (hex) => {
    return /^#([A-Fa-f0-9]{3}){1,2}$/.test(hex);
};
