import React, { useState } from "react";

type InfoVariant = "cloudevent" | "schemas";
type Anchor = "top-right" | "bottom-right";

interface InfoHelpProps {
  variant: InfoVariant;
  schemaUrl?: string;
  className?: string;
  anchor?: Anchor;
}

const InfoHelp: React.FC<InfoHelpProps> = ({ variant, schemaUrl, className, anchor = "top-right" }) => {
  const [open, setOpen] = useState(false);

  const buttonPos = anchor === "bottom-right" ? "bottom-2 right-2" : "top-2 right-2";
  const popoverStyle: React.CSSProperties =
    anchor === "bottom-right"
      ? { right: 0, bottom: "calc(100% + 8px)" }
      : { right: 0, top: "calc(100% + 8px)" };

  const content = (
    <div className={`absolute ${buttonPos} z-50`} style={{ pointerEvents: "auto" }}>
      <div className="relative">
      <button
        type="button"
        aria-label="Informatie"
        onClick={() => setOpen((v) => !v)}
        className={`w-6 h-6 flex items-center justify-center rounded-full border text-xs font-bold ${
          className || ""
        }`}
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border-primary)",
          color: "var(--text-secondary)",
        }}
      >
        <i className="fa-solid fa-circle-info" aria-hidden="true"></i>
      </button>
      {open && (
        <div
          className="absolute w-[min(80vw,380px)] p-3 rounded-md shadow-lg border"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-primary)",
            color: "var(--text-primary)",
            ...popoverStyle,
          }}
        >
          {variant === "cloudevent" ? (
            <div className="text-xs space-y-2">
              <p className="m-0">
                Dit is een <strong>CloudEvent</strong>. Het bevat metagegevens (zoals
                <code>id</code>, <code>source</code>, <code>time</code>) en een <code>data</code> veld.
              </p>
              <p className="m-0">
                In deze demo gebruiken we <strong>JSONCommit</strong> als één type om resources aan te maken,
                te wijzigen of te verwijderen. Het <code>data</code> veld bevat:
                <code>schema</code> (URL naar het resourceschema), <code>resource_id</code> en
                <code>resource_data</code> of een <code>patch</code> (JSON Merge Patch).
              </p>
              <ul className="list-disc ml-4">
                <li>
                  CloudEvent schema: <a href="/schemas/CloudEvent" target="_blank" rel="noreferrer">/schemas/CloudEvent</a>
                </li>
                <li>
                  JSONCommit schema: <a href="/schemas/JSONCommit" target="_blank" rel="noreferrer">/schemas/JSONCommit</a>
                </li>
                {schemaUrl && (
                  <li>
                    Resource schema: <a href={schemaUrl} target="_blank" rel="noreferrer">{schemaUrl}</a>
                  </li>
                )}
              </ul>
            </div>
          ) : (
            <div className="text-xs space-y-2">
              <p className="m-0">
                Formulieren worden automatisch gegenereerd op basis van <strong>JSON Schema</strong>.
                Alle beschikbare schemas vind je via <a href="/schemas" target="_blank" rel="noreferrer">/schemas</a>.
              </p>
              <p className="m-0">
                Een specifiek schema is beschikbaar op <code>/schemas/&lt;Naam&gt;</code> (bijvoorbeeld
                <a href="/schemas/Task" target="_blank" rel="noreferrer">/schemas/Task</a>).
              </p>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );

  return content;
};

export default InfoHelp;
