import React from 'react';
import { createRoot } from 'react-dom/client';
import Designer from './Designer';

// Initialize the product customizer
const initializeCustomizer = () => {
  const el = document.getElementById('designer-root');
  
  if (!el) {
    console.error('Designer root element not found');
    return;
  }

  const props = {
    variantId: el.dataset.variantId,
    productId: el.dataset.productId,
    productTitle: el.dataset.productTitle,
    variantPrice: el.dataset.variantPrice,
    currency: el.dataset.currency
  };

  const root = createRoot(el);
  root.render(<Designer {...props} />);
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCustomizer);
} else {
  initializeCustomizer();
}