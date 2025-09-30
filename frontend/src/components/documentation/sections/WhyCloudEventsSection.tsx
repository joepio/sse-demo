import React from 'react';

const WhyCloudEventsSection: React.FC = () => {
  return (
    <section id="waarom-cloudevents">
      <h2 className="text-2xl font-semibold mb-6" style={{ color: "var(--ro-lintblauw)" }}>
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
            <code>json.commit</code> events om meldingen te versturen.
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
  );
};

export default WhyCloudEventsSection;
