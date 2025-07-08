# 🎨 DesignNex Studio - 3D Product Customizer

Professional 3D product customization platform for Shopify stores, similar to Zakeke/Custivo. Built with React, Three.js, and AI-powered design generation.

## ✨ Features

- **3D Product Visualization** - Real-time Three.js 3D model rendering
- **AI Design Generation** - DALL-E powered custom graphics
- **Interactive Canvas** - Fabric.js 2D design editing
- **Shopify Integration** - Seamless cart and checkout integration
- **Ready Designs** - Pre-built design library
- **Custom Text & Images** - Full customization capabilities
- **Responsive Design** - Works on desktop and mobile
- **Professional UI** - Zakeke-style user experience

## 🚀 Quick Start

### Installation
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
=======
# 🎨 DesignNex Studio - 3D Product Customizer

> **Advanced 3D product customization platform with AI-powered design generation**

<div align="center">
  <img src="https://img.shields.io/badge/-React_JS-black?style=for-the-badge&logoColor=white&logo=react&color=61DAFB" alt="react.js" />
  <img src="https://img.shields.io/badge/-Three_JS-black?style=for-the-badge&logoColor=white&logo=threedotjs&color=000000" alt="three.js" />
  <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
  <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
  <img src="https://img.shields.io/badge/-OpenAI-black?style=for-the-badge&logoColor=white&logo=openai&color=412991" alt="openai" />
</div>

## ✨ Features

- **🎨 Canvas Designer**: Professional design tools with layers, undo/redo, drag-drop functionality
- **🤖 AI Design Generator**: DALL-E powered custom design creation with text prompts
- **📱 3D Real-time Preview**: Interactive Three.js 3D visualization with auto-sync
- **🔧 Advanced Tools**: Color picker, text editor, image upload, geometric shapes, draggable toolbar
- **💾 Design Management**: Save, load, and manage custom designs locally
- **🛍️ Shopify Ready**: Architected for future e-commerce integration
- **⚡ Real-time Sync**: Automatic synchronization between canvas and 3D preview
- **📱 Responsive**: Works seamlessly across all device sizes

## 🏗️ Project Structure

```
project_threejs_ai/
├── 🎨 canvas-project/          (Main Application - React + TypeScript)
│   ├── src/
│   │   ├── components/         (Canvas, 3D Viewer, UI Components)
│   │   │   ├── Canvas.tsx
│   │   │   ├── ThreeJSCanvas.tsx
│   │   │   ├── UnifiedProductCustomizer.tsx
│   │   │   ├── DraggableToolbar.tsx
│   │   │   └── sidebar/        (Design tools)
│   │   ├── services/           (API integrations)
│   │   │   └── aiService.ts    (OpenAI DALL-E integration)
│   │   ├── store/              (State management - Valtio)
│   │   ├── context/            (React contexts)
│   │   └── three-components/   (Three.js components)
│   └── public/                 (3D models, assets)
│       └── shirt_baked.glb     (3D t-shirt model)
├── 🔧 server/                  (Backend API - Node.js + Express)
│   ├── routes/
│   │   └── dalle.routes.js     (AI image generation API)
│   ├── index.js                (Server setup with CORS)
│   └── package.json
├── 📁 client/                  (Legacy - not in active use)
└── 📄 Documentation
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **OpenAI API Key** (for AI design generation)
- **Git** (for version control)

### Installation & Setup

1. **Clone Repository**
   ```bash
   git clone [your-private-repo-url]
   cd project_threejs_ai
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   
   # Create environment file
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   
   # Start backend server
   npm start
   ```
   ✅ **Backend running on:** `http://localhost:8080`

3. **Frontend Setup**
   ```bash
   cd ../canvas-project
   npm install
   
   # Start development server  
   npm run dev
   ```
   ✅ **Frontend running on:** `http://localhost:5173`

4. **Access Application**
   - Open browser → `http://localhost:5173`
   - Start designing! 🎨

## 🎮 How to Use

### 🎨 Design Creation
1. **Canvas Tools**: Use sidebar to add text, shapes, upload images
2. **AI Generator**: Enter text prompt → Click "Generate AI Design" 
3. **3D Preview**: Real-time preview updates automatically
4. **Customize**: Adjust colors, sizes, positions with toolbar
5. **Save/Export**: Save designs locally or download as images

### 🤖 AI Design Generation
```
Example Prompts:
• "Minimalist mountain logo in blue and white"
• "Geometric tiger face with bold lines" 
• "Vintage coffee shop emblem with retro styling"
• "Abstract galaxy design with purple nebula"
```

### 🔧 Advanced Features
- **Draggable Toolbar**: Move tools anywhere on screen
- **Undo/Redo**: Full history management
- **Layer Control**: Bring to front, duplicate objects
- **Auto-Sync**: Canvas automatically syncs to 3D model
- **Responsive Design**: Works on desktop, tablet, mobile

## 🔧 Configuration

### Environment Variables
```bash
# Backend (.env)
OPENAI_API_KEY=sk-proj-...your-key-here

# Frontend (optional - for client-side features) 
VITE_OPENAI_API_KEY=sk-proj-...your-key-here
```

### Feature Toggles
- ✅ **With API Key**: Real DALL-E generation, full AI features
- 🎭 **Without API Key**: Demo mode with placeholder images
- 🔄 **Always Available**: Canvas tools, 3D preview, save/load

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript** (Type-safe development)
- **Three.js** + **React Three Fiber** (3D rendering)
- **Fabric.js** (Canvas manipulation & drawing)
- **Valtio** (Reactive state management)
- **Tailwind CSS** (Utility-first styling)
- **Lucide React** (Beautiful icons)
- **Vite** (Fast development & build)

### Backend  
- **Node.js** + **Express** (REST API server)
- **OpenAI API** (DALL-E image generation)
- **CORS** (Cross-origin resource sharing)
- **dotenv** (Environment variable management)

### Development Tools
- **ESLint** + **TypeScript** (Code quality)
- **PostCSS** (CSS processing)
- **Nodemon** (Development server)

## 📱 Shopify Integration (Roadmap)

**Phase 1: Core Integration**
- Customer authentication via Shopify
- Product customization workflow
- Design data persistence

**Phase 2: E-commerce Features** 
- Admin dashboard for store owners
- Order management integration
- Subscription billing system

**Phase 3: Advanced Features**
- Multi-product support (t-shirts, hoodies, etc.)
- Bulk design operations
- Analytics & reporting

## 🔒 Security & Privacy

- ✅ **Private Repository**: Intellectual property protection
- ✅ **Environment Variables**: API keys stored securely  
- ✅ **No Sensitive Data**: No credentials committed to Git
- ✅ **CORS Configuration**: Controlled API access
- ✅ **Local Storage**: User designs stored client-side

## 📊 Project Status

| Component | Status | Notes |
|-----------|--------|--------|
| 🎨 Canvas Designer | ✅ Production Ready | Full feature set complete |
| 🤖 AI Integration | ✅ Production Ready | DALL-E integration working |
| 📱 3D Preview | ✅ Production Ready | Real-time sync implemented |
| 💾 Save/Load | ✅ Production Ready | Local storage working |
| 🛍️ Shopify Integration | 🔄 Planned | Architecture ready |
| 📱 Mobile Responsive | ✅ Production Ready | All screen sizes supported |

## 🚀 Performance

- **Canvas**: Optimized with Fabric.js for smooth drawing
- **3D Rendering**: Three.js with performance monitoring  
- **State Management**: Valtio for minimal re-renders
- **API Calls**: Efficient caching and error handling
- **Build Size**: Optimized with Vite tree-shaking

## 📄 License

**Private Project** - All rights reserved  
© 2024 DesignNex Studio

---

**Version:** 1.0.0  
**Last Updated:** July 2024  
**Status:** 🚀 Production Ready

<div align="center">
  <strong>Built with ❤️ for creative product customization</strong>
</div>
>>>>>>> 279936899e8ad0ec7452a28e8e3d5c9393f4ea20
