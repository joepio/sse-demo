import React from "react";
import PageHeader from "./PageHeader";

const ApiDocumentationView: React.FC = () => {
  return (
    <>
      <PageHeader />

      <div className="p-6 max-w-4xl mx-auto pt-8">
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
          >
            ← Terug naar Dashboard
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            API Documentatie - Real-time Events
          </h1>
          <div className="mb-4">
            <a
              href="/asyncapi-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
            >
              📋 Volledige AsyncAPI Specificatie →
            </a>
          </div>
        </div>

        <div className="space-y-12">
          {/* Table of Contents */}
          <section className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">📚 Inhoudsopgave</h2>
            <nav className="space-y-2">
              <a
                href="#waarom-cloudevents"
                className="block text-blue-600 hover:text-blue-800 hover:underline"
              >
                1. Waarom CloudEvents?
              </a>
              <a
                href="#drie-niveaus"
                className="block text-blue-600 hover:text-blue-800 hover:underline"
              >
                2. De 3 Niveaus van Event Structuur
              </a>
              <a
                href="#events-versturen"
                className="block text-blue-600 hover:text-blue-800 hover:underline"
              >
                3. Events Versturen (Producers)
              </a>
              <a
                href="#events-ontvangen"
                className="block text-blue-600 hover:text-blue-800 hover:underline"
              >
                4. Events Ontvangen (Consumers)
              </a>
            </nav>
          </section>

          {/* Chapter 1: Why CloudEvents */}
          <section id="waarom-cloudevents">
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">
              1. 🌟 Waarom CloudEvents?
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Het probleem met traditionele REST architecturen
                </h3>
                <p className="mb-4">
                  Traditionele systemen gebruiken vaak een "pull-based" model
                  waarbij verschillende services elkaar direct aanroepen via
                  REST API's. Dit zorgt voor een aantal problemen die alleen
                  maar erger worden naarmate een systeem groeit:
                </p>

                <p className="mb-4">
                  <strong>Tight coupling en cascade failures:</strong> Wanneer
                  service A direct service B aanroept, en B roept C aan, dan
                  zorgt een storing in C ervoor dat de hele keten vastloopt. In
                  complexe systemen met tientallen services ontstaat een fragiel
                  web van afhankelijkheden.
                </p>

                <p className="mb-4">
                  <strong>Inefficiënt polling:</strong> Om real-time updates te
                  krijgen moeten clients constant de server bevragen ("is er
                  iets nieuws?"). Dit verspilt bandbreedte, belast de server
                  onnodig, en introduceert vertraging - updates worden pas
                  zichtbaar bij de volgende poll.
                </p>

                <p className="mb-4">
                  <strong>Inconsistente interfaces:</strong> Elke service heeft
                  zijn eigen API design, foutafhandeling, en data formats. Dit
                  maakt integratie complex en foutgevoelig.
                </p>

                <p className="mb-4">
                  <strong>Moeilijk schalen:</strong> Nieuwe functionaliteit
                  vereist vaak wijzigingen in bestaande services. Een nieuwe
                  dashboard feature betekent extra endpoints, meer load op
                  databases, en risico op regressies in bestaande
                  functionaliteit.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Event-driven architectuur als oplossing
                </h3>
                <p className="mb-4">
                  Event-driven architecturen draaien dit om naar een
                  "push-based" model. In plaats van dat services elkaar
                  aanroepen, publiceren ze events wanneer er iets gebeurt.
                  Andere services kunnen naar deze events luisteren en hun eigen
                  state bijwerken.
                </p>

                <p className="mb-4">
                  <strong>Losse koppeling:</strong> Services weten niet van
                  elkaar. Ze publiceren alleen events ("er is een nieuwe zaak
                  aangemaakt") zonder te weten wie er naar luistert. Nieuwe
                  services kunnen zelf kiezen welke events ze interessant
                  vinden.
                </p>

                <p className="mb-4">
                  <strong>Real-time by design:</strong> Events worden
                  onmiddellijk doorgestuurd naar alle geïnteresseerde parties.
                  Geen polling, geen vertraging - wanneer iets gebeurt, weet
                  iedereen het meteen.
                </p>

                <p className="mb-4">
                  <strong>Natuurlijke audit trail:</strong> Events vormen
                  automatisch een chronologische geschiedenis van alles wat er
                  is gebeurd. Dit is waardevol voor debugging, compliance, en
                  business intelligence.
                </p>

                <p className="mb-4">
                  <strong>Graceful degradation:</strong> Als een service offline
                  gaat, kunnen events in een queue blijven staan. Wanneer de
                  service weer online komt, werkt hij de gemiste events af. De
                  rest van het systeem blijft gewoon doorwerken.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Waarom specifiek CloudEvents?
                </h3>
                <p className="mb-4">
                  Event-driven architectuur is een krachtig patroon, maar zonder
                  standaardisatie wordt het al snel een chaos van incompatibele
                  event formats. Elke service heeft zijn eigen manier om events
                  te structureren, wat integratie bemoeilijkt.
                </p>

                <p className="mb-4">
                  <strong>CloudEvents als lingua franca:</strong> CloudEvents is
                  een CNCF (Cloud Native Computing Foundation) specificatie die
                  een standaard format definieert voor event metadata. Net zoals
                  HTTP headers zorgen voor consistentie in web requests, zorgt
                  CloudEvents voor consistentie in events.
                </p>

                <p className="mb-4">
                  <strong>Metadata standaardisatie:</strong> Elke CloudEvent
                  heeft gestandaardiseerde velden zoals <code>source</code>{" "}
                  (waar komt het vandaan), <code>type</code> (wat voor soort
                  event is het), en <code>subject</code> (waar gaat het over).
                  Dit maakt het mogelijk om generieke tooling te bouwen die met
                  alle events kan werken.
                </p>

                <p className="mb-4">
                  <strong>Tooling ecosysteem:</strong> Omdat CloudEvents een
                  breed geaccepteerde standaard is, bestaat er een rijk
                  ecosysteem van libraries, monitoring tools, en cloud services
                  die er direct mee kunnen werken. Je hoeft niet steeds het wiel
                  opnieuw uit te vinden.
                </p>

                <p className="mb-4">
                  <strong>Cloud-native design:</strong> CloudEvents is ontworpen
                  voor moderne cloud architecturen met concepten zoals
                  distributed tracing, multiple clouds, en microservices. Het
                  werkt naadloos samen met technologieën zoals Kubernetes,
                  Knative, en serverless platforms.
                </p>

                <p className="mb-4">
                  <strong>Vendor neutrality:</strong> Door een open standaard te
                  gebruiken voorkom je vendor lock-in. CloudEvents events kunnen
                  verwerkt worden door Apache Kafka, AWS EventBridge, Google
                  Pub/Sub, of elk ander event platform dat de standaard
                  ondersteunt.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Praktische voordelen voor ontwikkelaars
                </h3>
                <p className="mb-4">
                  Voor ontwikkelaars betekent CloudEvents dat je niet meer hoeft
                  na te denken over event formatting. De standaard geeft je een
                  proven blueprint die je direct kunt gebruiken, met duidelijke
                  semantiek en uitgebreide documentatie.
                </p>

                <p className="mb-4">
                  <strong>Makkelijkere debugging:</strong> Omdat alle events
                  dezelfde metadata structuur hebben, kun je generieke tooling
                  bouwen om events te loggen, filteren, en analyseren. Event
                  tracing wordt veel eenvoudiger.
                </p>

                <p className="mb-4">
                  <strong>Snellere ontwikkeling:</strong> Nieuwe features kunnen
                  vaak gebouwd worden door alleen maar te luisteren naar
                  bestaande events, zonder bestaande code te wijzigen. Een
                  notification service hoeft alleen maar te luisteren naar{" "}
                  <code>item.created</code> events om meldingen te versturen.
                </p>

                <p className="mb-4">
                  <strong>Betere testing:</strong> Events maken het makkelijk om
                  systeem gedrag te testen. Je kunt mock events versturen om te
                  verifiëren dat je systeem correct reageert, zonder complexe
                  service dependencies op te zetten.
                </p>
              </div>
            </div>
          </section>

          {/* Chapter 2: Three Levels */}
          <section id="drie-niveaus">
            <h2 className="text-2xl font-semibold mb-6 text-green-600">
              2. 🏗️ De 3 Niveaus van Event Structuur
            </h2>

            <div className="space-y-8">
              {/* Level 1: CloudEvent Container */}
              <div className="border-l-4 border-gray-300 pl-6">
                <h3 className="text-xl font-semibold mb-4">
                  📦 Niveau 1: CloudEvent Container
                </h3>
                <p className="mb-4">
                  Elke gebeurtenis wordt verpakt in een{" "}
                  <code className="bg-white px-2 py-1 rounded">CloudEvent</code>
                  . Dit is de gestandaardiseerde envelop met metadata:
                </p>
                <div className="bg-white p-4 rounded border font-mono text-sm overflow-x-auto">
                  <pre>{`{
  "specversion": "1.0",           // CloudEvents versie
  "id": "evt-123",                // Unieke event identifier
  "source": "zaaksysteem",        // Welk systeem het verstuurde
  "subject": "zaak-456",          // Welke zaak het betreft
  "type": "item.updated",         // Type gebeurtenis (niveau 2)
  "time": "2025-01-15T10:30:00Z", // Wanneer het gebeurde
  "datacontenttype": "application/json",
  "data": { ... }                 // De inhoud (niveau 2)
}`}</pre>
                </div>
              </div>

              {/* Level 2: Event Types */}
              <div className="border-l-4 border-gray-300 pl-6">
                <h3 className="text-xl font-semibold mb-4">
                  ⚡ Niveau 2: Event Types
                </h3>
                <p className="mb-4">Er zijn 3 soorten gebeurtenissen:</p>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border border-gray-200 rounded">
                    <h4 className="font-semibold mb-2">🆕 item.created</h4>
                    <p className="text-sm mb-2">Nieuw item aangemaakt</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      item_data: volledig object
                    </code>
                  </div>
                  <div className="p-4 border border-gray-200 rounded">
                    <h4 className="font-semibold mb-2">✏️ item.updated</h4>
                    <p className="text-sm mb-2">Bestaand item gewijzigd</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      patch: alleen wijzigingen
                    </code>
                  </div>
                  <div className="p-4 border border-gray-200 rounded">
                    <h4 className="font-semibold mb-2">🗑️ item.deleted</h4>
                    <p className="text-sm mb-2">Item verwijderd</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      reason: waarom verwijderd
                    </code>
                  </div>
                </div>
              </div>

              {/* Level 3: Item Schemas */}
              <div className="border-l-4 border-gray-300 pl-6">
                <h3 className="text-xl font-semibold mb-4">
                  🧩 Niveau 3: Item Schemas
                </h3>
                <p className="mb-4">Elk item type heeft zijn eigen schema:</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3 border border-gray-200 rounded text-sm">
                    <h5 className="font-semibold">📋 Issue</h5>
                    <div className="text-xs mt-1 text-gray-600">
                      title, status, assignee
                    </div>
                  </div>
                  <div className="p-3 border border-gray-200 rounded text-sm">
                    <h5 className="font-semibold">✅ Task</h5>
                    <div className="text-xs mt-1 text-gray-600">
                      cta, completed, deadline
                    </div>
                  </div>
                  <div className="p-3 border border-gray-200 rounded text-sm">
                    <h5 className="font-semibold">💬 Comment</h5>
                    <div className="text-xs mt-1 text-gray-600">
                      content, author, mentions
                    </div>
                  </div>
                  <div className="p-3 border border-gray-200 rounded text-sm">
                    <h5 className="font-semibold">📄 Document</h5>
                    <div className="text-xs mt-1 text-gray-600">
                      title, url, size
                    </div>
                  </div>
                  <div className="p-3 border border-gray-200 rounded text-sm">
                    <h5 className="font-semibold">📅 Planning</h5>
                    <div className="text-xs mt-1 text-gray-600">
                      title, moments[]
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 3: Posting Events */}
          <section id="events-versturen">
            <h2 className="text-2xl font-semibold mb-6 text-orange-600">
              3. 📤 Events Versturen (Producers)
            </h2>

            <div className="space-y-6">
              <div className="border-l-4 border-gray-300 pl-6">
                <h3 className="font-semibold mb-3">HTTP POST naar /events</h3>
                <p className="mb-4">
                  Verstuur een CloudEvent via een eenvoudige HTTP POST request:
                </p>
                <div className="bg-white p-4 rounded border font-mono text-sm overflow-x-auto">
                  <pre>{`POST /events
Content-Type: application/json

{
  "specversion": "1.0",
  "id": "evt-${Date.now()}",
  "source": "mijn-applicatie",
  "subject": "zaak-123",
  "type": "item.created",
  "time": "2025-01-15T10:30:00Z",
  "datacontenttype": "application/json",
  "data": {
    "item_type": "issue",
    "item_id": "issue-456",
    "actor": "alice@gemeente.nl",
    "item_data": {
      "title": "Nieuwe parkeervergunning",
      "description": "Aanvraag voor parkeervergunning",
      "status": "open"
    }
  }
}`}</pre>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 rounded">
                  <h4 className="font-semibold mb-2">✨ Nieuw item maken</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        type: "item.created"
                      </code>
                    </div>
                    <div>
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        item_data: volledig object
                      </code>
                    </div>
                  </div>
                </div>
                <div className="p-4 border border-gray-200 rounded">
                  <h4 className="font-semibold mb-2">🔄 Item bijwerken</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        type: "item.updated"
                      </code>
                    </div>
                    <div>
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        patch: alleen wijzigingen
                      </code>
                    </div>
                  </div>
                </div>
                <div className="p-4 border border-gray-200 rounded">
                  <h4 className="font-semibold mb-2">🗑️ Item verwijderen</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        type: "item.deleted"
                      </code>
                    </div>
                    <div>
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        reason: "waarom"
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="font-semibold mb-3">JavaScript Voorbeeld</h3>
                <div className="bg-white p-4 rounded border font-mono text-sm overflow-x-auto">
                  <pre>{`const sendEvent = async (eventData) => {
  const response = await fetch('/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData)
  });

  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
  }

  return response.json();
};

// Gebruik:
await sendEvent({
  specversion: "1.0",
  id: \`evt-\${Date.now()}\`,
  source: "frontend-app",
  subject: "zaak-123",
  type: "item.updated",
  time: new Date().toISOString(),
  data: {
    item_type: "issue",
    item_id: "issue-456",
    actor: "user@gemeente.nl",
    patch: {
      status: "in_progress",
      assignee: "bob@gemeente.nl"
    }
  }
});`}</pre>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 4: Consuming Events */}
          <section id="events-ontvangen">
            <h2 className="text-2xl font-semibold mb-6 text-purple-600">
              4. 📥 Events Ontvangen (Consumers)
            </h2>

            <div className="space-y-6">
              <div className="border-l-4 border-gray-300 pl-6">
                <h3 className="font-semibold mb-3">Server-Sent Events (SSE)</h3>
                <p className="mb-4">
                  Ontvang real-time events via een persistente SSE verbinding:
                </p>
                <div className="bg-white p-4 rounded border font-mono text-sm overflow-x-auto">
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

              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="font-semibold mb-3">
                  JavaScript Client Voorbeeld
                </h3>
                <div className="bg-white p-4 rounded border font-mono text-sm overflow-x-auto">
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
              </div>

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

              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="font-semibold mb-3">
                  Snapshot vs Delta Pattern
                </h3>
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
              </div>
            </div>
          </section>

          {/* Footer */}
          <section className="border border-gray-200 p-6 rounded-lg">
            <h3 className="font-semibold mb-3">🚀 Aan de slag</h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Producers:</strong> Begin met het versturen van{" "}
                <code>item.created</code> events naar <code>/events</code>
              </p>
              <p>
                <strong>Consumers:</strong> Open een SSE verbinding naar{" "}
                <code>/events</code>
                en luister naar <code>snapshot</code> en <code>delta</code>{" "}
                events
              </p>
              <p>
                <strong>Testen:</strong> Gebruik de browser developer tools om
                events te inspecteren en de Network tab om SSE berichten te zien
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default ApiDocumentationView;
