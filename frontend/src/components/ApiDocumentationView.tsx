import React from "react";
import PageHeader from "./PageHeader";

import DocumentationLink from "./DocumentationLink";
import TableOfContents from "./TableOfContents";
import WhyCloudEventsSection from "./sections/WhyCloudEventsSection";
import ThreeLevelsSection from "./sections/ThreeLevelsSection";
import EventProducersSection from "./sections/EventProducersSection";
import EventConsumersSection from "./sections/EventConsumersSection";
import GetStartedFooter from "./sections/GetStartedFooter";

const ApiDocumentationView: React.FC = () => {
  return (
    <>
      <PageHeader />

      <div
        className="p-6 max-w-4xl mx-auto pt-8"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="mb-8">
          <DocumentationLink href="/" variant="back">
            ← Terug naar Dashboard
          </DocumentationLink>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--ro-lintblauw)" }}
          >
            API Documentatie - Real-time Events
          </h1>
          <div className="mb-4">
            <DocumentationLink
              href="/asyncapi-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium"
            >
              📋 Volledige AsyncAPI Specificatie →
            </DocumentationLink>
          </div>
        </div>

        <div className="space-y-12">
          {/* Table of Contents */}
          <TableOfContents
            items={[
              { id: "waarom-cloudevents", title: "Waarom CloudEvents?" },
              { id: "drie-niveaus", title: "De 3 Niveaus van Event Structuur" },
              { id: "events-versturen", title: "Events Versturen (Producers)" },
              { id: "events-ontvangen", title: "Events Ontvangen (Consumers)" },
            ]}
          />

          <WhyCloudEventsSection />
          <ThreeLevelsSection />
          <EventProducersSection />
          <EventConsumersSection />
          <GetStartedFooter />
        </div>
      </div>
    </>
  );
};

export default ApiDocumentationView;
