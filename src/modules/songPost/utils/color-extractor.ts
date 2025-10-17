// For now, we'll use a simple approach that generates colors based on the image URL
// This avoids the complexity of node-vibrant and still provides unique colors per album

export interface ExtractedColor {
  color: string;
  isDark: boolean;
}

export class ColorExtractor {
  /**
   * Generate a consistent dark background color based on album image URL
   * @param imageUrl - The URL of the album image
   * @returns Promise<ExtractedColor | null> - The generated color
   */
  static async extractColor(imageUrl: string): Promise<ExtractedColor | null> {
    try {
      if (!imageUrl || imageUrl.trim() === '') {
        return null;
      }

      // Generate a consistent color based on the URL hash
      const color = this.generateColorFromUrl(imageUrl);
      
      return {
        color: color,
        isDark: true // We generate dark colors
      };

    } catch (error) {
      console.error(`Error generating color from ${imageUrl}:`, error);
      return null;
    }
  }

  /**
   * Generate a consistent dark color from URL string
   * @param url - The image URL
   * @returns string - Generated hex color
   */
  private static generateColorFromUrl(url: string): string {
    // Simple hash function to convert URL to number
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use absolute value and modulo to get positive numbers
    const r = Math.abs(hash) % 100; // Keep red low for dark colors
    const g = Math.abs(hash >> 8) % 120; // Keep green moderate
    const b = Math.abs(hash >> 16) % 140; // Keep blue moderate
    
    // Convert to hex and ensure it's dark
    const hexR = Math.max(10, Math.min(r, 80)).toString(16).padStart(2, '0');
    const hexG = Math.max(20, Math.min(g, 100)).toString(16).padStart(2, '0');
    const hexB = Math.max(30, Math.min(b, 120)).toString(16).padStart(2, '0');
    
    return `#${hexR}${hexG}${hexB}`;
  }

  /**
   * Check if a hex color is dark enough for text overlay
   * @param hexColor - Hex color string (e.g., "#FF0000")
   * @returns boolean - True if the color is dark enough
   */
  private static isDarkEnough(hexColor: string): boolean {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate relative luminance (0 for black, 1 for white)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return true if the color is dark enough (luminance < 0.4)
    return luminance < 0.4;
  }

  /**
   * Darken a hex color
   * @param hexColor - Hex color string (e.g., "#FF0000")
   * @returns string - Darkened hex color
   */
  private static darkenColor(hexColor: string): string {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);
    
    // Darken by 60% (similar to Flutter implementation)
    const darkenFactor = 0.6;
    r = Math.round(r * darkenFactor);
    g = Math.round(g * darkenFactor);
    b = Math.round(b * darkenFactor);
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Get default background color based on theme
   * @param isDark - Whether the theme is dark
   * @returns string - Default hex color
   */
  static getDefaultColor(isDark: boolean = true): string {
    return isDark ? '#112525' : '#F5F5F5';
  }
}
