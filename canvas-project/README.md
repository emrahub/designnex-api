# Shopify Product Customizer Extension

A professional Shopify Theme App Extension that provides interactive product customization similar to Zakeke. This extension allows customers to personalize products with text, images, and ready-made designs directly on the product page.

## Features

- **Interactive Canvas**: Fabric.js-powered design canvas with full editing capabilities
- **Ready Designs**: Pre-built design library with categorized options
- **Custom Text**: Add and customize text with multiple fonts, sizes, and colors
- **Image Upload**: Upload custom images with drag-and-drop functionality
- **Design Management**: Save and load custom designs
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Shopify Integration**: Seamless cart integration with design data preservation

## Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build the Extension**:
   ```bash
   npm run build:customizer
   ```

3. **Deploy to Shopify**:
   ```bash
   shopify app deploy
   ```

## Usage

### Adding to Product Pages

1. Go to your Shopify admin
2. Navigate to Online Store > Themes
3. Click "Customize" on your active theme
4. Add a new section or block
5. Select "Product Customizer" from the available options
6. Configure the settings as needed
7. Save your changes

### Customization Options

The extension provides several customization options through the Shopify theme editor:

- **Section Heading**: Custom heading text
- **Description**: Descriptive text for the customizer
- **Canvas Size**: Choose from Small, Medium, or Large canvas sizes
- **Show/Hide Elements**: Toggle visibility of various UI elements

## Configuration

### Canvas Settings

The canvas size can be configured in the theme editor:
- **Small**: 600x450 pixels
- **Medium**: 800x600 pixels (default)
- **Large**: 1000x750 pixels

### Design Categories

You can add custom design categories through the theme editor by adding "Design Category" blocks. Each category accepts a JSON array of designs:

```json
[
  {
    "id": 1,
    "name": "Mountain Logo",
    "category": "Nature",
    "preview": "🏔️"
  },
  {
    "id": 2,
    "name": "Star Badge",
    "category": "Badges",
    "preview": "⭐"
  }
]
```

## Development

### Project Structure

```
extensions/product-customizer/
├── blocks/
│   └── product-customizer.liquid    # Main Liquid template
├── src/
│   ├── components/                  # React components
│   │   ├── Canvas.jsx
│   │   ├── Toolbar.jsx
│   │   ├── Sidebar.jsx
│   │   └── ...
│   ├── Designer.jsx                 # Main designer component
│   └── index.jsx                    # Entry point
├── assets/
│   ├── customizer.css              # Styling
│   └── product-customizer.bundle.js # Built JavaScript
├── locales/
│   └── en.default.json             # Translations
└── shopify.extension.toml          # Extension configuration
```

### Building

The extension uses esbuild for bundling:

```bash
npm run build:customizer
```

This command:
- Bundles the React application
- Excludes external dependencies (fabric.js loads separately)
- Outputs to `extensions/product-customizer/assets/product-customizer.bundle.js`

### Development Workflow

1. Make changes to the React components in `src/`
2. Update styles in `assets/customizer.css`
3. Build the extension: `npm run build:customizer`
4. Test in a development store
5. Deploy: `shopify app deploy`

## API Integration

### Cart Integration

When a customer adds a customized product to cart, the extension:

1. Captures the design data as JSON
2. Generates a preview image
3. Adds the product to cart with custom properties:
   - `Custom Design`: "Yes"
   - `Design Data`: JSON representation of the design
   - `Design Preview`: Base64 image data
   - `Customized On`: Timestamp

### Storage

- **Local Designs**: Saved to browser localStorage
- **Cart Data**: Sent to Shopify cart API
- **Order Data**: Included in order properties

## Styling

The extension uses a comprehensive CSS system with:

- **Responsive Design**: Mobile-first approach
- **Modern UI**: Clean, professional interface
- **Smooth Animations**: Hover effects and transitions
- **Accessibility**: Proper focus states and keyboard navigation

### CSS Variables

Key design tokens are defined in the CSS:
- Primary colors: Blue gradient (#3182ce to #2c5aa0)
- Secondary colors: Gray scale (#f8fafc to #1a202c)
- Spacing: Consistent 8px grid system
- Typography: System font stack with proper hierarchy

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Troubleshooting

### Common Issues

1. **Extension not appearing**: Ensure the extension is deployed and the theme is using the latest version
2. **Canvas not loading**: Check browser console for JavaScript errors
3. **Images not uploading**: Verify browser supports FileReader API
4. **Cart integration failing**: Check Shopify store settings and theme compatibility

### Debug Mode

To enable debug logging, add this to your browser console:
```javascript
localStorage.setItem('customizer_debug', 'true');
```

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For support and questions:
- Check the documentation
- Review common issues in the troubleshooting section
- Contact the development team

## Changelog

### Version 1.0.0
- Initial release
- Basic customization features
- Shopify Theme App Extension support
- Mobile responsive design
- Cart integration