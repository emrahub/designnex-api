import React from 'react';
import { 
  Palette, 
  Upload, 
  Type, 
  Save,
  Zap
} from 'lucide-react';
import DesignsTab from './sidebar/DesignsTab';
import UploadTab from './sidebar/UploadTab';
import TextTab from './sidebar/TextTab';
import MyDesignsTab from './sidebar/MyDesignsTab';

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedObject: fabric.Object | null;
  canvasRef: React.MutableRefObject<fabric.Canvas | null>;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeTab,
  onTabChange,
  selectedObject,
  canvasRef
}) => {
  const tabs = [
    { id: 'designs', label: 'Designs', icon: Palette, color: 'text-blue-600' },
    { id: 'upload', label: 'Upload', icon: Upload, color: 'text-green-600' },
    { id: 'text', label: 'Text', icon: Type, color: 'text-purple-600' },
    { id: 'saved', label: 'Saved', icon: Save, color: 'text-orange-600' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'designs':
        return <DesignsTab canvasRef={canvasRef} />;
      case 'upload':
        return <UploadTab canvasRef={canvasRef} />;
      case 'text':
        return <TextTab canvasRef={canvasRef} selectedObject={selectedObject} />;
      case 'saved':
        return <MyDesignsTab canvasRef={canvasRef} />;
      default:
        return <DesignsTab canvasRef={canvasRef} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex flex-col h-full">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-gray-50 via-blue-50 to-purple-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Palette className="w-3 h-3 text-white" />
              </div>
              <h2 className="text-sm font-bold text-gray-800">Design Tools</h2>
            </div>
            <div className="text-xs text-gray-500">Ready</div>
          </div>
        </div>

        {/* Compact Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-white">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 px-2 py-3 text-xs font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? `border-blue-500 ${tab.color} bg-gradient-to-t from-blue-50 to-white`
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <Icon size={16} />
                  <span className="text-[10px]">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </div>

      </div>
    </div>
  );
};

export default Sidebar;