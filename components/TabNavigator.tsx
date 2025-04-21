import React, { useState } from 'react';
import { colors } from '../styles/theme';

/**
 * A reusable tab navigator component.
 *
 * Props:
 * - tabs: Array of { id: string, icon: React.Component, ariaLabel: string, content: React.ReactNode, iconClassName?: string }
 * - defaultActive: id of the tab to activate by default
 * - classNameTabBar: classes for the tab bar container
 * - classNameActiveTab: classes for active tab button
 * - classNameInactiveTab: classes for inactive tab button
 * - classNameSeparator: classes for the separator between tabs and content
 * - classNameContent: classes for the content container
 * - iconClassName: default classes for the icon
 */
export default function TabNavigator({
  tabs,
  defaultActive,
  classNameTabBar = 'flex items-center justify-center p-2 space-x-4 border-t border-gray-700',
  classNameActiveTab = 'text-white',
  classNameInactiveTab = 'text-gray-400 hover:text-white',
  classNameSeparator = 'border-b-2 border-gray-700',
  classNameContent = 'p-4 flex-1 overflow-y-auto',
  iconClassName = 'h-5 w-5'
}) {
  const [activeTab, setActiveTab] = useState(defaultActive || (tabs[0] && tabs[0].id));
  return (
    <>
      <div className={classNameTabBar}>
        {tabs.map((tab, idx) => (
          <React.Fragment key={tab.id}>
            <button
              onClick={() => setActiveTab(tab.id)}
              className={`p-2 ${activeTab === tab.id ? classNameActiveTab : classNameInactiveTab}`}
              aria-label={tab.ariaLabel}
            >
              <tab.icon className={`${iconClassName} ${tab.iconClassName || ''}`} aria-hidden="true" />
            </button>
            {idx < tabs.length - 1 && <div className="w-px h-6" style={{ backgroundColor: colors.primary.dark }} />}
          </React.Fragment>
        ))}
      </div>
      <div className={classNameSeparator} />
      <div className={classNameContent}>
        {tabs.map(tab => (
          activeTab === tab.id && <React.Fragment key={tab.id}>{tab.content}</React.Fragment>
        ))}
      </div>
    </>
  );
}