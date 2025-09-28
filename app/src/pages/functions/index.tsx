import React, { useState } from 'react';

const tabs = ['Overview', 'Proposal', 'BEO', 'Tasks', 'Files', 'Emails', 'Payments', 'Activity'];

const FunctionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div>
      <h2>Functions</h2>
      <div>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ fontWeight: activeTab === tab ? 'bold' : 'normal' }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div>
        <h3>{activeTab}</h3>
        <p>Content for {activeTab} tab goes here.</p>
      </div>
    </div>
  );
};

export default FunctionsPage;
