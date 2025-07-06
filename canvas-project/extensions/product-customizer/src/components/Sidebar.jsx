import React from 'react';
import DesignsTab from './DesignsTab';
import UploadTab from './UploadTab';
import TextTab from './TextTab';
import MyDesignsTab from './MyDesignsTab';

const Sidebar = ({
  isOpen,
  activeTab,
  onTabChange,
  selectedObject,
  canvasRef,
  onCanvasChange
}) => {
  const tabs = [
    { id: 'designs', label: 'Ready Designs', icon: '🎨' },
    { id: 'upload', label: 'Upload', icon: '📁' },
    { id: 'text', label: 'Text', icon: '📝' },
    { id: 'saved', label: 'My Designs', icon: '💾' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'designs':
        return <DesignsTab canvasRef={canvasRef} onCanvasChange={onCanvasChange} />;
      case 'upload':
        return <UploadTab canvasRef={canvasRef} onCanvasChange={onCanvasChange} />;
      case 'text':
        return <TextTab canvasRef={canvasRef} selectedObject={selectedObject} onCanvasChange={onCanvasChange} />;
      case 'saved':
        return <MyDesignsTab canvasRef={canvasRef} onCanvasChange={onCanvasChange} />;
      default:
        return <DesignsTab canvasRef={canvasRef} onCanvasChange={onCanvasChange} />;
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>Design Tools</h2>
        <p>Customize your product</p>
      </div>

      <div className="sidebar-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Sidebar;