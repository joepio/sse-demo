import React from 'react';
import Card from './Card';
import DocumentationLink from './DocumentationLink';

interface TableOfContentsItem {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  items: TableOfContentsItem[];
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ items }) => {
  return (
    <Card padding="lg">
      <h2
        className="text-xl font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        📚 Inhoudsopgave
      </h2>
      <nav className="space-y-2">
        {items.map((item, index) => (
          <DocumentationLink
            key={item.id}
            href={`#${item.id}`}
            variant="nav"
          >
            {index + 1}. {item.title}
          </DocumentationLink>
        ))}
      </nav>
    </Card>
  );
};

export default TableOfContents;
