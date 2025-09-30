import React from "react";
import Card from "../../Card";

const ThreeLevelsSection: React.FC = () => {
  return (
    <section id="drie-niveaus">
      <h2
        className="text-2xl font-semibold mb-6"
        style={{ color: "var(--ro-lintblauw)" }}
      >
        2. 📊 De 3 Niveaus van Event Structuur
      </h2>

      <div className="space-y-8">
        {/* Level 1: CloudEvent Container */}
        <div className="pl-6">
          <h3 className="text-xl font-semibold mb-4">
            📦 Niveau 1: CloudEvent Container
          </h3>
          <p className="mb-4">
            Elke gebeurtenis wordt verpakt in een{" "}
            <code className="bg-white px-2 py-1 rounded">CloudEvent</code>. Dit
            is de gestandaardiseerde envelop met metadata:
          </p>
          <div className="bg-white p-4 rounded border font-mono text-sm overflow-x-auto">
            <pre>{`{
  "specversion": "1.0",           // CloudEvents versie
  "id": "evt-123",                // Unieke event identifier
  "source": "zaaksysteem",        // Welk systeem het verstuurde
  "subject": "zaak-456",          // Welke zaak het betreft
  "type": "json.commit",          // Type gebeurtenis (altijd json.commit)
  "time": "2025-01-15T10:30:00Z", // Wanneer het gebeurde
  "datacontenttype": "application/json",
  "data": { ... }                 // De inhoud (JSONCommit)
}`}</pre>
          </div>
        </div>

        {/* Level 2: JSONCommit Operations */}
        <div className="pl-6">
          <h3 className="text-xl font-semibold mb-4">
            ⚡ Niveau 2: JSONCommit Operaties
          </h3>
          <p className="mb-4">Alle wijzigingen gebruiken hetzelfde event type (json.commit), met verschillende velden:</p>

          <div className="grid md:grid-cols-3 gap-4">
            <Card padding="md">
              <h4 className="font-semibold mb-2">🆕 Aanmaken</h4>
              <p className="text-sm mb-2">Nieuw item aangemaakt</p>
              <code
                className="text-xs px-2 py-1"
                style={{
                  backgroundColor: "var(--ro-grijs-2)",
                  color: "var(--text-primary)",
                }}
              >
                resource_data: volledig object
              </code>
            </Card>
            <Card padding="md">
              <h4 className="font-semibold mb-2">✏️ Wijzigen</h4>
              <p className="text-sm mb-2">Bestaand item gewijzigd</p>
              <code
                className="text-xs px-2 py-1"
                style={{
                  backgroundColor: "var(--ro-grijs-2)",
                  color: "var(--text-primary)",
                }}
              >
                patch: alleen wijzigingen
              </code>
            </Card>
            <Card padding="md">
              <h4 className="font-semibold mb-2">🗑️ Verwijderen</h4>
              <p className="text-sm mb-2">Item verwijderd</p>
              <code
                className="text-xs px-2 py-1"
                style={{
                  backgroundColor: "var(--ro-grijs-2)",
                  color: "var(--text-primary)",
                }}
              >
                patch._deleted: true
              </code>
            </Card>
          </div>
        </div>

        {/* Level 3: Item Schemas */}
        <div className="pl-6">
          <h3 className="text-xl font-semibold mb-4">
            🧩 Niveau 3: Item Schemas
          </h3>
          <p className="mb-4">Elk item type heeft zijn eigen schema:</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Card padding="sm">
              <h5 className="font-semibold">📋 Issue</h5>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                title, status, assignee
              </div>
            </Card>
            <Card padding="sm">
              <h5 className="font-semibold">✅ Task</h5>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                cta, completed, deadline
              </div>
            </Card>
            <Card padding="sm">
              <h5 className="font-semibold">💬 Comment</h5>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                content, mentions
              </div>
            </Card>
            <Card padding="sm">
              <h5 className="font-semibold">📄 Document</h5>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                title, url, size
              </div>
            </Card>
            <Card padding="sm">
              <h5 className="font-semibold">📅 Planning</h5>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                title, status, deadline
              </div>
            </Card>
            <Card padding="sm">
              <h5 className="font-semibold">👤 Person</h5>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                name, role, contact
              </div>
            </Card>
          </div>

          <div
            className="mt-6 p-4 rounded"
            style={{ backgroundColor: "var(--ro-grijs-1)" }}
          >
            <h4 className="font-semibold mb-2">
              💡 Flexibiliteit door scheiding
            </h4>
            <p className="text-sm">Door deze 3-niveau structuur kun je:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>
                • <strong>Niveau 1:</strong> Algemene event tooling bouwen die
                met alle events werkt
              </li>
              <li>
                • <strong>Niveau 2:</strong> Type-specifieke logica schrijven
                (bijv. alleen luisteren naar updates)
              </li>
              <li>
                • <strong>Niveau 3:</strong> Domain-specifieke business logica
                implementeren
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThreeLevelsSection;
