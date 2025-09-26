import React from 'react';
import Card from '../Card';

const GetStartedFooter: React.FC = () => {
  return (
    <Card padding="lg">
      <h3 className="font-semibold mb-3">🚀 Aan de slag</h3>
      <div className="space-y-2 text-sm">
        <p>
          <strong>Producers:</strong> Begin met het versturen van{" "}
          <code>item.created</code> events naar <code>/events</code>
        </p>
        <p>
          <strong>Consumers:</strong> Open een SSE verbinding naar{" "}
          <code>/events</code>
          {" "}en luister naar <code>snapshot</code> en <code>delta</code>{" "}
          events
        </p>
        <p>
          <strong>Testen:</strong> Gebruik de browser developer tools om
          events te inspecteren en de Network tab om SSE berichten te zien
        </p>
      </div>
    </Card>
  );
};

export default GetStartedFooter;
