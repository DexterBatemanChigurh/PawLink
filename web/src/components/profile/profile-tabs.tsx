interface Tab {
  key: string
  label: string
}

interface ProfileTabsProps {
  tabs: readonly Tab[]
  active: string
  onChange: (key: string) => void
}

export function ProfileTabs({ tabs, active, onChange }: ProfileTabsProps) {
  return (
    <>
      <div className="px-1">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`px-4 py-4 text-sm font-medium transition-colors relative ${
                active === tab.key
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {active === tab.key && (
                <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
      <hr className="border-gray-300" />
    </>
  )
}
