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
    <div className="flex border-b border-border mb-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-3 py-1.5 text-xs font-medium capitalize border-b-2 transition-all duration-200
            ${activeTab === tab.id 
              ? 'text-primary border-primary' 
              : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}