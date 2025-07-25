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
    <div className="w-full border-b border-border/40">
      <nav className="flex space-x-0" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative px-4 py-2.5 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1
              ${activeTab === tab.id
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}