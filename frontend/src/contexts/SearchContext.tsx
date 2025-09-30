import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import MiniSearch from "minisearch";
import { useSSE } from "./SSEContext";

interface SearchResult {
  id: string;
  item_id: string;
  schema: string;
  type: string;
  title?: string;
  content?: string;
  description?: string;
  cta?: string;
  score: number;
  match: Record<string, string[]>;
}

interface SearchContextType {
  search: (query: string) => SearchResult[];
  isIndexing: boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { items } = useSSE();
  const [isIndexing, setIsIndexing] = useState(false);

  // Create MiniSearch instance
  const miniSearch = useMemo(() => {
    return new MiniSearch({
      fields: ["title", "content", "description", "cta", "type"], // fields to index
      storeFields: ["item_id", "schema", "type", "title", "content", "description", "cta"], // fields to return
      searchOptions: {
        boost: { title: 2, cta: 2, description: 1.5 }, // boost title and cta matches
        fuzzy: 0.2,
        prefix: true,
      },
    });
  }, []);

  // Index all items whenever they change
  useEffect(() => {
    const indexItems = async () => {
      setIsIndexing(true);
      try {
        // Clear existing index
        miniSearch.removeAll();

        // Convert items to searchable documents
        const documents = Object.entries(items).map(([itemId, itemData]) => {
          const data = itemData as Record<string, unknown>;

          // Determine item type from the item_id prefix or other data
          let itemType = "unknown";

          if (itemId.startsWith("task-")) {
            itemType = "task";
          } else if (itemId.startsWith("comment-")) {
            itemType = "comment";
          } else if (itemId.startsWith("planning-")) {
            itemType = "planning";
          } else if (itemId.startsWith("doc-")) {
            itemType = "document";
          } else if (!itemId.includes("-")) {
            // Simple numeric IDs are issues
            itemType = "issue";
          } else if (data.cta) {
            itemType = "task";
          } else if (data.content && !data.title) {
            itemType = "comment";
          } else if (data.moments) {
            itemType = "planning";
          } else if (data.url && data.size) {
            itemType = "document";
          } else if (data.title && data.status) {
            itemType = "issue";
          }

          return {
            id: itemId,
            item_id: itemId,
            schema: (data.schema as string) || "",
            type: itemType,
            title: (data.title as string) || "",
            content: (data.content as string) || "",
            description: (data.description as string) || "",
            cta: (data.cta as string) || "",
          };
        });

        // Add documents to index
        miniSearch.addAll(documents);
      } catch (error) {
        console.error("Error indexing items:", error);
      } finally {
        setIsIndexing(false);
      }
    };

    indexItems();
  }, [items, miniSearch]);

  const search = (query: string): SearchResult[] => {
    if (!query.trim()) {
      return [];
    }

    try {
      const results = miniSearch.search(query, {
        boost: { title: 2, cta: 2 },
        fuzzy: 0.2,
        prefix: true,
      });

      // Map MiniSearch results to our SearchResult type
      return results.map((result) => ({
        id: result.id as string,
        item_id: result.item_id as string,
        schema: result.schema as string,
        type: result.type as string,
        title: result.title as string | undefined,
        content: result.content as string | undefined,
        description: result.description as string | undefined,
        cta: result.cta as string | undefined,
        score: result.score,
        match: result.match || {},
      }));
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  };

  return (
    <SearchContext.Provider value={{ search, isIndexing }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};
