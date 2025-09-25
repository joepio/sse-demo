import React, { useState } from "react";
import type { ItemType } from "../types";

// Schema imports are loaded dynamically to avoid build issues

const ApiDocumentationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("events");
  const [activeSchema, setActiveSchema] = useState<string>("CloudEvent");
  const [schemas, setSchemas] = useState<Record<string, any>>({});
  const [schemasLoaded, setSchemasLoaded] = useState(false);

  // Load schemas dynamically
  React.useEffect(() => {
    const loadSchemas = async () => {
      try {
        const schemaFiles = [
          "CloudEvent",
          "Issue",
          "Task",
          "Comment",
          "Planning",
          "PlanningMoment",
          "ItemEventData",
        ];

        const loadedSchemas: Record<string, any> = {};

        for (const schemaName of schemaFiles) {
          try {
            const response = await fetch(
              `/src/types/${schemaName}.schema.json`,
            );
            if (response.ok) {
              loadedSchemas[schemaName] = await response.json();
            } else {
              // Fallback schema
              loadedSchemas[schemaName] = {
                title: schemaName,
                type: "object",
                description: `Schema voor ${schemaName} (kon niet worden geladen)`,
              };
            }
          } catch (error) {
            console.warn(`Could not load ${schemaName} schema:`, error);
            loadedSchemas[schemaName] = {
              title: schemaName,
              type: "object",
              description: `Schema voor ${schemaName} (kon niet worden geladen)`,
            };
          }
        }

        setSchemas(loadedSchemas);
        setSchemasLoaded(true);
      } catch (error) {
        console.error("Failed to load schemas:", error);
        setSchemasLoaded(true);
      }
    };

    loadSchemas();
  }, []);

  const eventTypes = [
    {
      type: "item.created",
      description:
        "Een nieuw item (zaak, taak, opmerking, planning) is aangemaakt",
      example: "Nieuwe zaak ingediend, nieuwe planning opgesteld",
    },
    {
      type: "item.updated",
      description: "Een bestaand item is gewijzigd",
      example: "Status van zaak bijgewerkt, planning moment voltooid",
    },
    {
      type: "item.deleted",
      description: "Een item is verwijderd",
      example: "Zaak afgesloten en gearchiveerd",
    },
  ];

  const itemTypes: { type: ItemType; description: string; fields: string[] }[] =
    [
      {
        type: "issue",
        description:
          "Zaken - hoofdobjecten die een probleem, verzoek of proces vertegenwoordigen",
        fields: [
          "id",
          "title",
          "description",
          "status",
          "assignee",
          "created_at",
          "resolution",
        ],
      },
      {
        type: "task",
        description: "Taken - specifieke acties die uitgevoerd moeten worden",
        fields: [
          "id",
          "cta",
          "description",
          "url",
          "completed",
          "deadline",
          "actor",
        ],
      },
      {
        type: "comment",
        description: "Opmerkingen - tekstuele toevoegingen aan zaken",
        fields: ["id", "content", "author", "parent_id", "mentions"],
      },
      {
        type: "planning",
        description:
          "Planningen - gestructureerde tijdlijnen met meerdere momenten",
        fields: ["id", "title", "description", "moments"],
      },
    ];

  const exampleEvents = {
    created: {
      specversion: "1.0",
      id: "01997ff0-db63-7061-a42f-36a32b2c3ca2",
      source: "frontend-create",
      subject: "issue-123",
      type: "item.created",
      time: "2025-01-15T10:30:00Z",
      datacontenttype: "application/json",
      data: {
        item_type: "issue",
        item_id: "issue-123",
        actor: "alice@gemeente.nl",
        item_data: {
          id: "issue-123",
          title: "Parkeervergunning aanvraag",
          description: "Burger wil parkeervergunning voor nieuwe auto",
          status: "open",
          assignee: "alice@gemeente.nl",
          created_at: "2025-01-15T10:30:00Z",
        },
      },
    },
    updated: {
      specversion: "1.0",
      id: "01997ff0-db63-7061-a42f-36a32b2c3ca4",
      source: "server-demo-event",
      subject: "issue-123",
      type: "item.updated",
      time: "2025-01-15T10:45:00Z",
      datacontenttype: "application/merge-patch+json",
      data: {
        item_type: "issue",
        item_id: "issue-123",
        actor: "bob@gemeente.nl",
        patch: {
          assignee: "bob@gemeente.nl",
          status: "in_progress",
        },
      },
    },
    deleted: {
      specversion: "1.0",
      id: "01997ff0-db63-7061-a42f-36a32b2c3ca6",
      source: "frontend-demo-event",
      subject: "issue-123",
      type: "item.deleted",
      time: "2025-01-15T12:00:00Z",
      datacontenttype: "application/json",
      data: {
        item_type: "issue",
        item_id: "issue-123",
        actor: "system",
        item_data: {
          id: "issue-123",
          reason: "Verwijderd vanuit tijdlijn weergave",
        },
      },
    },
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="mb-4">
          <a
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Terug naar Dashboard
          </a>
        </div>
        <h1 className="text-3xl font-bold mb-4">SSE Demo API Documentatie</h1>
        <p className="text-lg text-gray-600">
          Complete gids voor de Server-Sent Events API met CloudEvents
          specificatie
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "events", label: "Events Aanmaken" },
            { id: "schemas", label: "Schema's & Types" },
            { id: "integration", label: "Integratie" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Events Tab */}
      {activeTab === "events" && (
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Wat is CloudEvents?</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="mb-4">
                CloudEvents is een open specificatie voor het beschrijven van
                event data op een consistente manier. Onze API gebruikt
                CloudEvents om alle gebeurtenissen in het systeem te
                standaardiseren.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Voordelen:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Gestandaardiseerde event structuur</li>
                    <li>Interoperabiliteit tussen systemen</li>
                    <li>Uitgebreide metadata ondersteuning</li>
                    <li>Traceerbaarheid van events</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Kernvelden:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>
                      <code>specversion</code> - CloudEvents versie (altijd
                      "1.0")
                    </li>
                    <li>
                      <code>id</code> - Unieke event identifier
                    </li>
                    <li>
                      <code>source</code> - Bron van het event
                    </li>
                    <li>
                      <code>type</code> - Type gebeurtenis
                    </li>
                    <li>
                      <code>time</code> - Tijdstip van gebeurtenis (ISO 8601)
                    </li>
                    <li>
                      <code>subject</code> - Onderwerp (meestal zaak ID)
                    </li>
                    <li>
                      <code>data</code> - De eigenlijke event data
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Event Types</h2>
            <p className="text-gray-600 mb-6">
              Alle events in het systeem gebruiken een van deze vier standaard
              event types:
            </p>
            <div className="grid gap-4">
              {eventTypes.map((event) => (
                <div
                  key={event.type}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <h3 className="font-mono text-xl font-semibold text-blue-600 mb-3">
                    {event.type}
                  </h3>
                  <p className="text-gray-700 mb-3 text-lg">
                    {event.description}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Voorbeelden:</strong> {event.example}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Event Structuur</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="mb-4">
                Elk CloudEvent heeft dezelfde basisstructuur met een{" "}
                <code>data</code> veld dat de specifieke informatie bevat:
              </p>
              <pre className="bg-white border rounded p-4 text-sm overflow-auto">
                {`{
  "specversion": "1.0",
  "id": "unieke-event-id",
  "source": "frontend-create",
  "subject": "zaak-123",
  "type": "item.created",
  "time": "2025-01-15T10:30:00Z",
  "datacontenttype": "application/json",
  "data": {
    "item_type": "issue",
    "item_id": "issue-123",
    "actor": "gebruiker@gemeente.nl",
    "item_data": {
      // Hier staat de specifieke data van het item
    }
  }
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Veld Structuur</h2>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <p className="mb-4">
                Het <code>data</code> veld bevat altijd deze standaard velden:
              </p>
              <div className="space-y-4">
                <div>
                  <code className="bg-white px-2 py-1 rounded font-semibold">
                    item_type
                  </code>
                  <p className="text-sm text-gray-600 mt-1">
                    Het type item (issue, task, comment, planning). Dit bepaalt
                    welk schema gebruikt wordt.
                  </p>
                </div>
                <div>
                  <code className="bg-white px-2 py-1 rounded font-semibold">
                    item_id
                  </code>
                  <p className="text-sm text-gray-600 mt-1">
                    Unieke identifier van het specifieke item.
                  </p>
                </div>
                <div>
                  <code className="bg-white px-2 py-1 rounded font-semibold">
                    actor
                  </code>
                  <p className="text-sm text-gray-600 mt-1">
                    Wie heeft deze actie uitgevoerd (email of systeem naam).
                  </p>
                </div>
                <div>
                  <code className="bg-white px-2 py-1 rounded font-semibold">
                    item_data
                  </code>
                  <p className="text-sm text-gray-600 mt-1">
                    De volledige data van het item (voor created events) of
                    patch data (voor updated events).
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Eigen Schemas Gebruiken
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="mb-4">
                <strong>
                  Je kunt ook je eigen item types en schemas gebruiken!
                </strong>
              </p>
              <p className="mb-4">
                Zolang je event voldoet aan de CloudEvents specificatie en de
                standaard data structuur gebruikt, kun je eigen{" "}
                <code>item_type</code> waarden en bijbehorende schemas
                definiëren.
              </p>
              <div className="bg-white border rounded p-4">
                <h4 className="font-semibold mb-2">
                  Bijvoorbeeld een custom "document" type:
                </h4>
                <pre className="text-sm overflow-auto">
                  {`{
  "specversion": "1.0",
  "id": "doc-event-001",
  "source": "document-service",
  "subject": "zaak-456",
  "type": "item.created",
  "time": "2025-01-15T11:00:00Z",
  "datacontenttype": "application/json",
  "data": {
    "item_type": "document",  // ← Custom type
    "item_id": "doc-789",
    "actor": "uploader@gemeente.nl",
    "item_data": {
      "id": "doc-789",
      "filename": "vergunning.pdf",
      "size": 2048576,
      "mime_type": "application/pdf",
      "upload_date": "2025-01-15T11:00:00Z"
    }
  }
}`}
                </pre>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Het systeem zal deze events gewoon doorsturen via Server-Sent
                Events. Clients kunnen zelf bepalen hoe ze custom types
                verwerken.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* Schemas Tab */}
      {activeTab === "schemas" && (
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Standaard Item Types
            </h2>
            <p className="text-gray-600 mb-6">
              Het systeem heeft vier ingebouwde item types met bijbehorende
              schemas. Deze worden automatisch gegenereerd vanuit de Rust
              backend types.
            </p>
            <div className="grid gap-6">
              {itemTypes.map((item) => (
                <div
                  key={item.type}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-mono text-xl font-semibold text-green-600 mb-2">
                        {item.type}
                      </h3>
                      <p className="text-gray-700 text-lg">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Schema velden:</h4>
                    <div className="grid md:grid-cols-2 gap-2">
                      {item.fields.map((field) => (
                        <div key={field} className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {field}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">JSON Schema Viewer</h2>
            <p className="text-gray-600 mb-6">
              Bekijk de volledige JSON Schema's van alle beschikbare types. Deze
              schemas worden gebruikt voor validatie en TypeScript type
              generatie.
            </p>

            {/* Schema Selection */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.keys(schemas).map((schemaName) => (
                <button
                  key={schemaName}
                  onClick={() => setActiveSchema(schemaName)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    activeSchema === schemaName
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {schemaName}
                </button>
              ))}
            </div>

            {/* Schema Display */}
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="font-mono font-semibold">
                  {activeSchema}.schema.json
                </h3>
              </div>
              <div className="p-4">
                {schemasLoaded ? (
                  <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm">
                    {JSON.stringify(
                      schemas[activeSchema] || {
                        error: "Schema niet gevonden",
                      },
                      null,
                      2,
                    )}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">
                      Schema's worden geladen...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">TypeScript Types</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="mb-4">
                Alle JSON schemas worden automatisch omgezet naar TypeScript
                interfaces. Deze zijn beschikbaar in de frontend voor type-safe
                development.
              </p>
              <pre className="bg-white border rounded p-4 text-sm overflow-auto">
                {`// Automatisch gegenereerde types importeren
import type {
  CloudEvent,
  Issue,
  Task,
  Comment,
  Planning,
  PlanningMoment,
  ItemType,
  IssueStatus,
  PlanningStatus
} from "../types";

// Type-safe gebruik in componenten
const IssueComponent: React.FC<{ issue: Issue }> = ({ issue }) => {
  return (
    <div>
      <h1>{issue.title}</h1>
      <p>Status: {issue.status}</p> {/* TypeScript kent alle mogelijke statussen */}
      <p>Toegewezen aan: {issue.assignee}</p>
      <p>Aangemaakt: {new Date(issue.created_at).toLocaleDateString()}</p>
    </div>
  );
};

// Type guards voor runtime checks
const isIssue = (data: any): data is Issue => {
  return data && typeof data.id === 'string' && typeof data.title === 'string';
};`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Eigen Types Definiëren
            </h2>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <p className="mb-4">
                <strong>
                  Je kunt ook volledig eigen item types en schemas gebruiken!
                </strong>
              </p>
              <p className="mb-4">
                Het systeem accepteert elk <code>item_type</code> zolang het
                CloudEvent correct geformatteerd is. Je bent niet beperkt tot de
                vier standaard types.
              </p>

              <h4 className="font-semibold mb-3">Stappen voor eigen types:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Definieer je eigen <code>item_type</code> string (bijv.
                  "document", "invoice", "contract")
                </li>
                <li>
                  Maak een JSON schema voor je <code>item_data</code> structuur
                </li>
                <li>
                  Verstuur CloudEvents met je custom <code>item_type</code>
                </li>
                <li>
                  Implementeer frontend logic om je custom events te verwerken
                </li>
              </ol>
              <p className="mt-4 text-sm text-gray-600">
                <strong>Let op:</strong> Het systeem valideert alleen de
                CloudEvent structuur en standaard data velden. Je eigen{" "}
                <code>item_data</code> validatie moet je zelf implementeren.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* Integration Tab */}
      {activeTab === "integration" && (
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Hoe het Systeem Werkt
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="font-semibold mb-2">1. Event Aanmaken</h3>
                  <p className="text-sm text-gray-600">
                    Frontend maakt CloudEvent en verstuurt via HTTP POST
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <h3 className="font-semibold mb-2">2. Server Verwerking</h3>
                  <p className="text-sm text-gray-600">
                    Server ontvangt, valideert en distribueert event
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📡</span>
                  </div>
                  <h3 className="font-semibold mb-2">3. Real-time Updates</h3>
                  <p className="text-sm text-gray-600">
                    Alle clients ontvangen event via Server-Sent Events
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">API Eindpunten</h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded font-mono text-sm">
                    POST
                  </span>
                  <code className="font-mono text-lg">/events</code>
                </div>
                <p className="text-gray-700 mb-3">
                  Verstuur een nieuw CloudEvent naar de server voor verwerking
                  en distributie.
                </p>
                <div className="bg-gray-50 rounded p-4">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Content-Type:</strong>{" "}
                      <code>application/json</code>
                      <br />
                      <strong>Body:</strong> CloudEvent JSON object
                    </div>
                    <div>
                      <strong>Response:</strong> <code>200 OK</code> bij succes
                      <br />
                      <strong>Error:</strong> <code>400 Bad Request</code> bij
                      ongeldige data
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-mono text-sm">
                    GET
                  </span>
                  <code className="font-mono text-lg">/events</code>
                </div>
                <p className="text-gray-700 mb-3">
                  Ontvang real-time CloudEvents via Server-Sent Events stream.
                </p>
                <div className="bg-gray-50 rounded p-4">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Accept:</strong> <code>text/event-stream</code>
                      <br />
                      <strong>Response:</strong> SSE stream
                    </div>
                    <div>
                      <strong>Format:</strong> Een CloudEvent per SSE message
                      <br />
                      <strong>Connection:</strong> Blijft open voor real-time
                      updates
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Event Voorbeelden</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-green-600">
                  item.created - Nieuwe Zaak
                </h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(exampleEvents.created, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-blue-600">
                  item.updated - Zaak Bijwerken
                </h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(exampleEvents.updated, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-red-600">
                  item.deleted - Zaak Verwijderen
                </h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(exampleEvents.deleted, null, 2)}
                </pre>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Frontend Integratie</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold mb-3">Event versturen:</h3>
              <pre className="bg-white border rounded p-4 text-sm overflow-auto mb-4">
                {`// Event versturen naar server
const sendEvent = async (event: CloudEvent) => {
  const response = await fetch('/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error('Failed to send event');
  }
};`}
              </pre>

              <h3 className="font-semibold mb-3">Events ontvangen:</h3>
              <pre className="bg-white border rounded p-4 text-sm overflow-auto">
                {`// SSE verbinding opzetten
const eventSource = new EventSource('/events');

eventSource.onmessage = (event) => {
  const cloudEvent: CloudEvent = JSON.parse(event.data);
  console.log('Received event:', cloudEvent);

  // Update lokale state
  handleIncomingEvent(cloudEvent);
};

eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
};`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Frontend Code Voorbeelden
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Event Versturen</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <pre className="bg-white border rounded p-4 text-sm overflow-auto">
                    {`// Event naar server versturen
const sendEvent = async (event: CloudEvent) => {
  const response = await fetch('/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error('Event verzenden mislukt');
  }
};

// Nieuwe zaak aanmaken
const createIssue = async (title: string, description: string) => {
  const event: CloudEvent = {
    specversion: "1.0",
    id: crypto.randomUUID(),
    source: "frontend-create",
    subject: crypto.randomUUID(), // zaak ID
    type: "item.created",
    time: new Date().toISOString(),
    datacontenttype: "application/json",
    data: {
      item_type: "issue",
      item_id: crypto.randomUUID(),
      actor: "gebruiker@gemeente.nl",
      item_data: {
        id: crypto.randomUUID(),
        title,
        description,
        status: "open",
        created_at: new Date().toISOString()
      }
    }
  };

  await sendEvent(event);
};`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Events Ontvangen</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <pre className="bg-white border rounded p-4 text-sm overflow-auto">
                    {`// SSE verbinding opzetten
const eventSource = new EventSource('/events');

eventSource.onmessage = (event) => {
  const cloudEvent: CloudEvent = JSON.parse(event.data);

  console.log('Event ontvangen:', cloudEvent.type);
  console.log('Item type:', cloudEvent.data?.item_type);

  // Verwerk verschillende event types
  switch (cloudEvent.type) {
    case 'item.created':
      handleItemCreated(cloudEvent);
      break;
    case 'item.updated':
      handleItemUpdated(cloudEvent);
      break;
    case 'item.deleted':
      handleItemDeleted(cloudEvent);
      break;
    default:
      console.log('Onbekend event type:', cloudEvent.type);
  }
};

eventSource.onerror = (error) => {
  console.error('SSE verbinding fout:', error);
};`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Type-Safe Development
                </h3>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <pre className="bg-white border rounded p-4 text-sm overflow-auto">
                    {`import type { CloudEvent, Issue, Task } from "../types";

// Type-safe event handlers
const handleItemCreated = (event: CloudEvent) => {
  const data = event.data;

  if (data?.item_type === 'issue') {
    const issue = data.item_data as Issue;
    console.log('Nieuwe zaak:', issue.title);
    // TypeScript weet dat issue alle Issue velden heeft
  }

  if (data?.item_type === 'task') {
    const task = data.item_data as Task;
    console.log('Nieuwe taak:', task.cta);
    // TypeScript valideert alle Task velden
  }
};

// Custom type handling
const handleCustomEvent = (event: CloudEvent) => {
  const data = event.data;

  if (data?.item_type === 'document') {
    // Je eigen document type logic
    const document = data.item_data as any; // Of je eigen Document type
    console.log('Nieuw document:', document.filename);
  }
};`}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Schema Updates</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="mb-4">
                De TypeScript types en JSON schemas worden automatisch
                bijgewerkt wanneer de Rust backend types wijzigen:
              </p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm mb-4">
                {`# Schemas en types regenereren
cargo build

# Of via NPM script
npm run generate`}
              </pre>
              <p className="text-sm text-gray-600">
                Dit zorgt ervoor dat frontend en backend altijd synchroon
                blijven. Je krijgt compile-time errors als je verouderde types
                gebruikt.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ApiDocumentationView;
