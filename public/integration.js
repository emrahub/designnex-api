/**
 * DesignNex Studio - Universal Integration Script
 * Custivo-style integration for any Shopify store
 * Version: 1.0.0
 */

(function() {
  'use strict';
  
  const DESIGNNEX_CONFIG = {
    STUDIO_URL: 'https://designnex-studio.vercel.app',
    API_URL: 'https://designnex-api-production.railway.app',
    VERSION: '1.0.0'
  };

  // Get configuration from script tag
  const scriptTag = document.querySelector('script[data-designnex-key]');
  if (!scriptTag) {
    console.warn('DesignNex: Integration script missing data-designnex-key');
    return;
  }

  const config = {
    apiKey: scriptTag.getAttribute('data-designnex-key'),
    platform: scriptTag.getAttribute('data-platform') || 'shopify',
    theme: scriptTag.getAttribute('data-theme') || 'default',
    autoInit: scriptTag.getAttribute('data-auto-init') !== 'false'
  };

  // DesignNex Integration Class
  class DesignNexIntegration {
    constructor(config) {
      this.config = config;
      this.isInitialized = false;
      this.customizers = new Map();
      
      if (config.autoInit) {
        this.init();
      }
    }

    init() {
      if (this.isInitialized) return;
      
      console.log(`DesignNex Studio v${DESIGNNEX_CONFIG.VERSION} initializing...`);
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
      
      this.isInitialized = true;
    }

    setup() {
      this.injectCSS();
      this.createCustomizeButtons();
      this.setupEventListeners();
      this.enableCartIntegration();
      
      console.log('✅ DesignNex Studio ready!');
    }

    injectCSS() {
      const css = `
        .designnex-customize-btn {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
          border: none;
          border-radius: 8px;
          padding: 16px 20px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          font-size: 16px;
          width: 100%;
          margin: 10px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }
        
        .designnex-customize-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
        }
        
        .designnex-customize-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .designnex-loading {
          opacity: 0.8;
        }
        
        @keyframes designnex-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .designnex-loading .designnex-icon {
          animation: designnex-pulse 1s infinite;
        }
      `;
      
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    }

    createCustomizeButtons() {
      // Find product forms or containers
      const productForms = document.querySelectorAll('form[action*="/cart/add"], .product-form, [data-product-id]');
      
      productForms.forEach(form => {
        const productId = this.extractProductId(form);
        const productTitle = this.extractProductTitle(form);
        
        if (productId) {
          this.addCustomizeButton(form, productId, productTitle);
        }
      });
    }

    extractProductId(element) {
      // Try multiple methods to get product ID
      const productIdInput = element.querySelector('input[name="id"], input[name="product-id"]');
      if (productIdInput) return productIdInput.value;
      
      const dataProductId = element.getAttribute('data-product-id') || 
                           element.closest('[data-product-id]')?.getAttribute('data-product-id');
      if (dataProductId) return dataProductId;
      
      // Try to extract from URL or page data
      const urlMatch = window.location.pathname.match(/products\/[^\/]+/);
      if (urlMatch && window.ShopifyAnalytics?.meta?.product?.id) {
        return window.ShopifyAnalytics.meta.product.id;
      }
      
      return null;
    }

    extractProductTitle(element) {
      // Try to find product title
      const titleElement = element.querySelector('.product-title, h1, [data-product-title]') ||
                          document.querySelector('.product-title, h1[itemprop="name"], .product__title');
      
      if (titleElement) return titleElement.textContent.trim();
      
      // Fallback to page title
      return document.title.split(' |')[0].split(' -')[0].trim();
    }

    addCustomizeButton(container, productId, productTitle) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'designnex-customize-btn';
      button.innerHTML = `
        <span class="designnex-icon">🎨</span>
        <span>Customize Product</span>
      `;
      
      button.addEventListener('click', () => {
        this.openCustomizer(productId, productTitle, button);
      });
      
      // Find the best place to insert the button
      const addToCartBtn = container.querySelector('button[type="submit"], .btn-product-add, [name="add"]');
      if (addToCartBtn) {
        addToCartBtn.parentNode.insertBefore(button, addToCartBtn);
      } else {
        container.appendChild(button);
      }
      
      this.customizers.set(productId, { button, container, productTitle });
    }

    openCustomizer(productId, productTitle, button) {
      button.classList.add('designnex-loading');
      button.disabled = true;
      button.innerHTML = `
        <span class="designnex-icon">⏳</span>
        <span>Opening Studio...</span>
      `;
      
      const studioUrl = `${DESIGNNEX_CONFIG.STUDIO_URL}?product_id=${productId}&product_title=${encodeURIComponent(productTitle)}&mode=customize&api_key=${this.config.apiKey}`;
      
      const customizerWindow = window.open(
        studioUrl,
        'designnex-studio',
        'width=1400,height=900,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no'
      );
      
      if (customizerWindow) {
        customizerWindow.focus();
        
        // Reset button after delay
        setTimeout(() => {
          button.classList.remove('designnex-loading');
          button.disabled = false;
          button.innerHTML = `
            <span class="designnex-icon">🎨</span>
            <span>Customize Product</span>
          `;
        }, 2000);
      }
      
      // Track analytics
      this.trackEvent('customizer_opened', {
        product_id: productId,
        product_title: productTitle
      });
    }

    setupEventListeners() {
      // Listen for customization completion
      window.addEventListener('message', (event) => {
        if (event.data.type === 'designnex-customization-complete') {
          this.handleCustomizationComplete(event.data);
        }
      });
    }

    handleCustomizationComplete(data) {
      const { productId, designData } = data;
      const customizer = this.customizers.get(productId);
      
      if (!customizer) return;
      
      // Add customization data to product form
      const form = customizer.container.closest('form') || customizer.container.querySelector('form');
      if (form) {
        this.addHiddenInputs(form, designData);
        this.showSuccessMessage();
        this.updateCustomizeButton(customizer.button, true);
      }
      
      // Track completion
      this.trackEvent('customization_completed', {
        product_id: productId,
        design_id: designData.designId
      });
    }

    addHiddenInputs(form, designData) {
      // Remove existing customization inputs
      const existingInputs = form.querySelectorAll('input[name^="properties[DesignNex"]');
      existingInputs.forEach(input => input.remove());
      
      // Add new customization data
      const inputs = [
        { name: 'properties[DesignNex Customized]', value: 'Yes' },
        { name: 'properties[Design ID]', value: designData.designId },
        { name: 'properties[Design Data]', value: JSON.stringify(designData.canvasData) },
        { name: 'properties[Customization Date]', value: new Date().toLocaleDateString() }
      ];
      
      inputs.forEach(inputData => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = inputData.name;
        input.value = inputData.value;
        form.appendChild(input);
      });
    }

    updateCustomizeButton(button, isCustomized) {
      if (isCustomized) {
        button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        button.innerHTML = `
          <span class="designnex-icon">✅</span>
          <span>Design Applied</span>
        `;
      }
    }

    showSuccessMessage() {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 500;
      `;
      
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">✅</span>
          <div>
            <div style="font-weight: 600;">Design Applied!</div>
            <div style="font-size: 14px; opacity: 0.9;">Your custom design is ready</div>
          </div>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.transition = 'all 0.3s ease';
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }, 4000);
    }

    enableCartIntegration() {
      // Add cart integration features
      this.monitorCartChanges();
    }

    monitorCartChanges() {
      // Watch for cart updates to maintain customization data
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            // Re-scan for new product forms
            this.createCustomizeButtons();
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    trackEvent(eventName, data = {}) {
      // Analytics tracking
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
          event_category: 'DesignNex',
          custom_parameters: data
        });
      }
      
      // Send to DesignNex analytics
      fetch(`${DESIGNNEX_CONFIG.API_URL}/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          data: data,
          apiKey: this.config.apiKey,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {}); // Silent fail
    }
  }

  // Initialize DesignNex
  window.DesignNex = new DesignNexIntegration(config);
  
  // Global API
  window.DesignNex.openCustomizer = function(productId, productTitle) {
    window.DesignNex.openCustomizer(productId, productTitle);
  };
  
})();