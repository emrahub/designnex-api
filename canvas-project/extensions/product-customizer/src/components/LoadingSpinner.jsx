import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <div className="loading-text">Processing...</div>
      </div>
    </div>
  );
};

export default LoadingSpinner;