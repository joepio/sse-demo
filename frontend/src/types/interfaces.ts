// Auto-generated TypeScript interfaces
// Generated from Rust JSON schemas using json-schema-to-typescript
// Run 'pnpm run generate' to regenerate
//
// Last generated: 2025-09-26T07:48:23.109Z

/**
 * Planning structure
 */
export interface Planning {
  /**
   * Beschrijving van de planning
   */
  description?: string | null;
  /**
   * Unieke planning identifier
   */
  id: string;
  /**
   * Planning momenten - verschillende fasen of mijlpalen
   */
  moments: {
    /**
     * Geplande datum in YYYY-MM-DD formaat
     */
    date: string;
    /**
     * Unieke moment identifier
     */
    id: string;
    /**
     * Huidige status van dit moment
     */
    status: "completed" | "current" | "planned";
    /**
     * Titel van dit planning moment (bijv. "Intake gesprek", "Documentcheck")
     */
    title: string;
  }[];
  /**
   * Titel van de planning
   */
  title: string;
}

export type PlanningStatus = "completed" | "current" | "planned";

/**
 * CloudEvents specification struct
 */
export interface CloudEvent {
  /**
   * The event payload
   */
  data?: {
    [k: string]: unknown;
  };
  /**
   * Content type of the data value
   */
  datacontenttype?: string | null;
  /**
   * Reference to external data location
   */
  dataref?: string | null;
  /**
   * Schema that the data adheres to
   */
  dataschema?: string | null;
  /**
   * Identifies the event
   */
  id: string;
  /**
   * Sequence number for event ordering
   */
  sequence?: string | null;
  /**
   * Type of sequence numbering used
   */
  sequencetype?: string | null;
  /**
   * Identifies the context in which an event happened
   */
  source: string;
  /**
   * The version of the CloudEvents specification
   */
  specversion: string;
  /**
   * Identifies the subject of the event in the context of the event producer
   */
  subject?: string | null;
  /**
   * Timestamp of when the occurrence happened
   */
  time?: string | null;
  /**
   * The type of event related to the originating occurrence
   */
  type: string;
}

/**
 * Issue/Zaak structure
 */
export interface Issue {
  /**
   * Email adres van de toegewezen persoon (bijv. alice@gemeente.nl)
   */
  assignee?: string | null;
  /**
   * Aanmaak tijdstip in ISO 8601 formaat
   */
  created_at: string;
  /**
   * Uitgebreide beschrijving van de zaak - wat is er aan de hand, welke stappen zijn ondernomen
   */
  description?: string | null;
  /**
   * Unieke zaak identifier
   */
  id: string;
  /**
   * Reden voor sluiting (alleen bij gesloten zaken)
   */
  resolution?: string | null;
  /**
   * Huidige status van de zaak
   */
  status: "open" | "in_progress" | "closed";
  /**
   * Titel van de zaak - korte, duidelijke omschrijving
   */
  title: string;
}

/**
 * Document
 */
export interface Document {
  /**
   * Unieke document identifier
   */
  id: string;
  /**
   * Grootte in bytes
   */
  size: number;
  /**
   * Naam van het document
   */
  title: string;
  /**
   * URL naar het document. Moet downloaddbaar zijn
   */
  url: string;
}

export type ItemType = "issue" | "comment" | "task" | "planning";

/**
 * Task/Taak structure
 */
export interface Task {
  /**
   * Email van degene die de taak heeft aangemaakt of toegewezen
   */
  actor?: string | null;
  /**
   * Of de taak voltooid is (true) of nog open staat (false)
   */
  completed: boolean;
  /**
   * Actie tekst - korte beschrijving van wat er gedaan moet worden
   */
  cta: string;
  /**
   * Deadline voor deze taak in YYYY-MM-DD formaat
   */
  deadline?: string | null;
  /**
   * Uitgebreide beschrijving van de taak - context, voorwaarden, instructies
   */
  description: string;
  /**
   * Unieke taak identifier
   */
  id: string;
  /**
   * URL waar de taak uitgevoerd kan worden of meer informatie te vinden is
   */
  url?: string | null;
}

/**
 * Event data structure for item-based events
 */
export interface ItemEventData {
  /**
   * Volledige item data (voor create/update events)
   */
  item_data?: {
    [k: string]: unknown;
  };
  /**
   * Unieke identifier van het item
   */
  item_id: string;
  /**
   * Type item (issue, task, comment, planning)
   */
  item_type: "issue" | "comment" | "task" | "planning";
  /**
   * Schema URL voor de item_data inhoud
   */
  itemschema?: string | null;
  /**
   * Patch data voor updates (alleen gewijzigde velden)
   */
  patch?: {
    [k: string]: unknown;
  };
}

/**
 * Comment/Reactie structure
 */
export interface Comment {
  /**
   * Email van de auteur van de reactie
   */
  author?: string | null;
  /**
   * Inhoud van de reactie of opmerking
   */
  content: string;
  /**
   * Unieke reactie identifier
   */
  id: string;
  /**
   * Email adressen van vermelde personen (bijv. ["alice@gemeente.nl", "bob@gemeente.nl"])
   */
  mentions?: string[] | null;
  /**
   * ID van de reactie waar dit een antwoord op is (voor threading)
   */
  parent_id?: string | null;
}

export type IssueStatus = "open" | "in_progress" | "closed";

export interface PlanningMoment {
  /** Unieke moment identifier */
  id: string;
  /** Geplande datum in YYYY-MM-DD formaat */
  date: string;
  /** Titel van dit planning moment */
  title: string;
  /** Huidige status van dit moment */
  status: "completed" | "current" | "planned";
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