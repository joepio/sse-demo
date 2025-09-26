// Auto-generated TypeScript interfaces
// Generated from Rust JSON schemas using json-schema-to-typescript
// Run 'pnpm run generate' to regenerate
//
// Last generated: 2025-09-26T11:00:47.496Z

/**
 * Document dat bij een zaak hoort (bijv. paspoortfoto, uittreksel GBA)
 */
export interface Document {
  /**
   * Unieke identificatie van het document
   */
  id: string;
  /**
   * Bestandsgrootte in bytes
   */
  size: number;
  /**
   * Bestandsnaam of titel van het document (bijv. "Paspoortfoto_Jan_Jansen.jpg")
   */
  title: string;
  /**
   * Download URL van het document - moet toegankelijk zijn voor geautoriseerde gebruikers
   */
  url: string;
}

/**
 * Reactie - een opmerking, vraag of toelichting bij een zaak
 */
export interface Comment {
  /**
   * Email van degene die de reactie heeft geschreven
   */
  author?: string | null;
  /**
   * De tekst van de reactie (bijv. "Documenten zijn goedgekeurd", "Burger gebeld voor aanvullende info")
   */
  content: string;
  /**
   * Unieke reactie ID
   */
  id: string;
  /**
   * Email adressen van collega's die specifiek genoemd worden (bijv. "@alice@gemeente.nl")
   */
  mentions?: string[] | null;
  /**
   * ID van de reactie waar dit een antwoord op is (voor discussies met meerdere berichten)
   */
  parent_id?: string | null;
}

/**
 * Een specifieke stap of mijlpaal binnen een planning
 */
export interface PlanningMoment {
  /**
   * Geplande of gerealiseerde datum (YYYY-MM-DD, bijv. "2024-01-15")
   */
  date: string;
  /**
   * Unieke identificatie van dit moment
   */
  id: string;
  /**
   * In welke fase dit moment zich bevindt
   */
  status: "completed" | "current" | "planned";
  /**
   * Naam van deze stap (bijv. "Intake gesprek", "Documentcheck", "Besluit gemeente")
   */
  title: string;
}

/**
 * Planning - een tijdlijn met verschillende stappen of fasen voor zaakbehandeling
 */
export interface Planning {
  /**
   * Uitleg over wat deze planning behelst en welke stappen doorlopen worden
   */
  description?: string | null;
  /**
   * Unieke planning ID
   */
  id: string;
  /**
   * Alle stappen/momenten in deze planning, in chronologische volgorde
   */
  moments: {
    /**
     * Geplande of gerealiseerde datum (YYYY-MM-DD, bijv. "2024-01-15")
     */
    date: string;
    /**
     * Unieke identificatie van dit moment
     */
    id: string;
    /**
     * In welke fase dit moment zich bevindt
     */
    status: "completed" | "current" | "planned";
    /**
     * Naam van deze stap (bijv. "Intake gesprek", "Documentcheck", "Besluit gemeente")
     */
    title: string;
  }[];
  /**
   * Naam van de planning (bijv. "Vergunningsprocedure", "Paspoort aanvraag proces")
   */
  title: string;
}

/**
 * Zaak - een burgerzaak of aanvraag die door de gemeente behandeld wordt
 */
export interface Issue {
  /**
   * Email van de ambtenaar die de zaak behandelt (bijv. "alice@gemeente.nl")
   */
  assignee?: string | null;
  /**
   * Wanneer de zaak is aangemaakt (ISO 8601 formaat: 2024-01-15T10:30:00Z)
   */
  created_at: string;
  /**
   * Uitgebreide beschrijving: wat is de aanvraag, welke stappen zijn al ondernomen
   */
  description?: string | null;
  /**
   * Unieke zaaknummer
   */
  id: string;
  /**
   * Hoe de zaak is afgesloten (alleen bij status "gesloten")
   */
  resolution?: string | null;
  /**
   * Huidige behandelstatus van de zaak
   */
  status: "open" | "in_progress" | "closed";
  /**
   * Korte, duidelijke titel van de zaak (bijv. "Paspoort aanvragen", "Kapvergunning Dorpsstraat 12")
   */
  title: string;
}

/**
 * Status van een zaak in behandeling
 */
export type IssueStatus = "open" | "in_progress" | "closed";

/**
 * CloudEvents specification struct
 */
export interface CloudEvent {
  /**
   * De eigenlijke gebeurtenis data - bevat informatie over wat er is gebeurd
   */
  data?: {
    [k: string]: unknown;
  };
  /**
   * Formaat van de data (meestal "application/json")
   */
  datacontenttype?: string | null;
  /**
   * Verwijzing naar externe data locatie (indien data niet inline staat)
   */
  dataref?: string | null;
  /**
   * URL naar het schema dat de data beschrijft
   */
  dataschema?: string | null;
  /**
   * Unieke identificatie van deze gebeurtenis
   */
  id: string;
  /**
   * Volgnummer voor het ordenen van gebeurtenissen
   */
  sequence?: string | null;
  /**
   * Type van de volgnummering die gebruikt wordt
   */
  sequencetype?: string | null;
  /**
   * Bron systeem dat de gebeurtenis heeft aangemaakt (bijv. "zaaksysteem", "frontend-demo")
   */
  source: string;
  /**
   * Versie van de CloudEvents specificatie (altijd "1.0")
   */
  specversion: string;
  /**
   * Het onderwerp van de gebeurtenis, meestal de zaak ID waar het over gaat
   */
  subject?: string | null;
  /**
   * Tijdstip waarop de gebeurtenis plaatsvond (ISO 8601 formaat)
   */
  time?: string | null;
  /**
   * Type gebeurtenis (bijv. "item.created", "item.updated", "item.deleted")
   */
  type: string;
}

/**
 * Status van een planning moment
 */
export type PlanningStatus = "completed" | "current" | "planned";

/**
 * Taak - een actie die uitgevoerd moet worden om een zaak te behandelen
 */
export interface Task {
  /**
   * Email van degene die de taak heeft toegewezen of aangemaakt
   */
  actor?: string | null;
  /**
   * Is de taak voltooid? (true = klaar, false = nog te doen)
   */
  completed: boolean;
  /**
   * Korte actie-omschrijving (bijv. "Documenten controleren", "Afspraak inplannen")
   */
  cta: string;
  /**
   * Uiterste datum voor voltooiing (YYYY-MM-DD, bijv. "2024-01-25")
   */
  deadline?: string | null;
  /**
   * Uitgebreide uitleg: wat moet er precies gebeuren, welke voorwaarden gelden
   */
  description: string;
  /**
   * Unieke taaknummer
   */
  id: string;
  /**
   * Link naar de plaats waar de taak uitgevoerd kan worden (bijv. formulier, overzicht)
   */
  url?: string | null;
}

/**
 * Soorten items in het zaaksysteem
 */
export type ItemType = "issue" | "comment" | "task" | "planning" | "document";

/**
 * Gebeurtenis data voor zaakgerelateerde items (zaken, taken, reacties, planning)
 */
export interface ItemEventData {
  /**
   * Email van de persoon die de actie heeft uitgevoerd (bijv. "alice@gemeente.nl", "user@gemeente.nl")
   */
  actor?: string | null;
  /**
   * Complete item gegevens (bij aanmaken of volledige updates)
   */
  item_data?: {
    [k: string]: unknown;
  };
  /**
   * Unieke identificatie van het item waar de gebeurtenis over gaat
   */
  item_id: string;
  /**
   * Soort item: zaak, taak, reactie of planning
   */
  item_type: "issue" | "comment" | "task" | "planning" | "document";
  /**
   * URL naar het schema dat de structuur van item_data beschrijft
   */
  itemschema?: string | null;
  /**
   * Alleen de gewijzigde velden (bij gedeeltelijke updates)
   */
  patch?: {
    [k: string]: unknown;
  };
  /**
   * Tijdstip waarop de gebeurtenis plaatsvond (ISO 8601 formaat: 2024-01-15T10:30:00Z)
   */
  timestamp?: string | null;
}


// Schema metadata interface for runtime schema fetching
export interface SchemaMetadata {
  schemas: string[];
  base_url: string;
  description: string;
}

// Helper function to fetch schemas from the server
export async function fetchSchema(schemaName: string): Promise<any> {
  const response = await fetch(`/schemas/${schemaName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch schema ${schemaName}: ${response.statusText}`);
  }
  return response.json();
}

// Helper function to get all available schemas
export async function fetchSchemaIndex(): Promise<SchemaMetadata> {
  const response = await fetch('/schemas');
  if (!response.ok) {
    throw new Error(`Failed to fetch schema index: ${response.statusText}`);
  }
  return response.json();
}