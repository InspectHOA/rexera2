import { styles, colors } from '@/styles/workflow-detail';

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
    <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border.default}`, marginBottom: '16px' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            ...styles.tabButton,
            color: activeTab === tab.id ? colors.primary : colors.text.secondary,
            borderBottomColor: activeTab === tab.id ? colors.primary : 'transparent'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.color = colors.text.primary;
              e.currentTarget.style.background = colors.background.secondary;
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.color = colors.text.secondary;
              e.currentTarget.style.background = 'none';
            }
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}