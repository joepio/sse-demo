import React from "react";
import Card from "../Card";

const EventConsumersSection: React.FC = () => {
  return (
    <section id="events-ontvangen">
      <h2
        className="text-2xl font-semibold mb-6"
        style={{ color: "var(--ro-lintblauw)" }}
      >
        4. 📥 Events Ontvangen (Consumers)
      </h2>

      <div className="space-y-6">
        <div className="pl-6">
          <h3 className="font-semibold mb-3">Server-Sent Events (SSE)</h3>
          <p className="mb-4">
            Ontvang real-time events via een persistente SSE verbinding:
          </p>
          <div
            className="p-4 font-mono text-sm overflow-x-auto"
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-primary)",
            }}
          >
            <pre>{`GET /events
Accept: text/event-stream
Cache-Control: no-cache

// Server response:
HTTP/1.1 200 OK
Content-Type: text/event-stream
Connection: keep-alive

event: snapshot
data: [{"specversion":"1.0",...}, ...]

event: delta
data: {"specversion":"1.0","type":"item.updated",...}`}</pre>
          </div>
        </div>

        <Card padding="lg">
          <h3 className="font-semibold mb-3">JavaScript Client Voorbeeld</h3>
          <div
            className="p-4 font-mono text-sm overflow-x-auto"
            style={{
              backgroundColor: "var(--ro-grijs-1)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-primary)",
            }}
          >
            <pre>{`// SSE verbinding opzetten
const eventSource = new EventSource('/events');

// Snapshot: alle bestaande events (bij verbinding)
eventSource.addEventListener('snapshot', (event) => {
  const allEvents = JSON.parse(event.data);
  console.log('Snapshot ontvangen:', allEvents.length, 'events');

  // Initiële state opbouwen
  buildInitialState(allEvents);
});

// Delta: nieuwe events (real-time)
eventSource.addEventListener('delta', (event) => {
  const cloudEvent = JSON.parse(event.data);
  console.log('Nieuw event:', cloudEvent.type);

  // State bijwerken
  handleNewEvent(cloudEvent);
});

// Event verwerken
const handleNewEvent = (cloudEvent) => {
  const { type, subject, data } = cloudEvent;

  switch (type) {
    case 'item.created':
      if (data.item_type === 'issue') {
        addIssue(subject, data.item_data);
      }
      break;

    case 'item.updated':
      if (data.item_type === 'issue') {
        updateIssue(subject, data.patch);
      }
      break;

    case 'item.deleted':
      if (data.item_type === 'issue') {
        removeIssue(subject);
      }
      break;
  }
};

// Foutafhandeling
eventSource.onerror = (error) => {
  console.error('SSE fout:', error);
  // EventSource probeert automatisch opnieuw te verbinden
};`}</pre>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-200 rounded">
            <h4 className="font-semibold mb-3">✅ Voordelen SSE</h4>
            <ul className="text-sm space-y-1">
              <li>• Real-time updates</li>
              <li>• Automatische herverbinding</li>
              <li>• Simpeler dan WebSockets</li>
              <li>• Werkt door firewalls</li>
              <li>• Ingebouwde event structuur</li>
            </ul>
          </div>
          <div className="p-4 border border-gray-200 rounded">
            <h4 className="font-semibold mb-3">⚡ Best Practices</h4>
            <ul className="text-sm space-y-1">
              <li>• Luister naar zowel snapshot als delta</li>
              <li>• Implementeer graceful error handling</li>
              <li>• Gebruik event deduplicatie</li>
              <li>• Filter events op client side</li>
              <li>• Update UI incrementeel</li>
            </ul>
          </div>
        </div>

        <Card padding="lg">
          <h3 className="font-semibold mb-3">Snapshot vs Delta Pattern</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">📸 Snapshot</h4>
              <ul className="space-y-1">
                <li>• Alle events bij verbinding</li>
                <li>• Bouwe initiële state op</li>
                <li>• Gebeurt eenmalig</li>
                <li>• Handig voor nieuwe clients</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">⚡ Delta</h4>
              <ul className="space-y-1">
                <li>• Nieuwe events real-time</li>
                <li>• Update bestaande state</li>
                <li>• Continu tijdens verbinding</li>
                <li>• Efficiënt voor updates</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default EventConsumersSection;
