import React, { useState } from 'react';

const BEOEditor: React.FC = () => {
  const [printPreview, setPrintPreview] = useState(false);

  return (
    <div>
      <h2>BEO Editor</h2>
      <button onClick={() => setPrintPreview(!printPreview)}>
        {printPreview ? 'Edit Mode' : 'Print Preview'}
      </button>
      {printPreview ? (
        <div>
          <h3>Print Preview</h3>
          <p>Printable BEO content goes here...</p>
        </div>
      ) : (
        <div>
          <h3>Edit Mode</h3>
          <textarea style={{ width: '100%', height: '300px' }} defaultValue="Editable BEO content..." />
        </div>
      )}
    </div>
  );
};

export default BEOEditor;
