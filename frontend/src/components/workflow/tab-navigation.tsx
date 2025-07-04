interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'details', label: 'Details' },
  { id: 'files', label: 'Files' },
  { id: 'audit', label: 'Audit' },
  { id: 'notes', label: 'Notes' }
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex border-b border-gray-200 mb-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-3 py-1.5 text-xs font-medium capitalize border-b-2 transition-all duration-200
            ${activeTab === tab.id 
              ? 'text-primary-600 border-primary-600' 
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}