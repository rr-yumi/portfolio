const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2026-03-11";
const NOTION_DATABASE_QUERY_VERSION = "2022-06-28";
const PROPERTY_TITLE = "\u30bf\u30a4\u30c8\u30eb";
const PROPERTY_INDUSTRY = "\u696d\u754c";
const PROPERTY_RESPONSIBILITIES = "\u62c5\u5f53\u7bc4\u56f2";
const PROPERTY_TECHNOLOGIES = "\u4f7f\u7528\u6280\u8853";

type NotionText = {
  plain_text?: string;
};

type NotionOption = {
  name?: string;
};

type NotionProperty = {
  type?: string;
  title?: NotionText[];
  rich_text?: NotionText[];
  select?: NotionOption | null;
  multi_select?: NotionOption[];
};

type NotionPage = {
  properties?: Record<string, NotionProperty>;
};

type NotionQueryResponse = {
  results?: NotionPage[];
};

export type WorkItem = {
  title: string;
  industry: string;
  responsibilities: string[];
  technologies: string[];
};

export type WorksState = {
  items: WorkItem[];
  error: string | null;
};

function normalizeNotionId(rawId: string): string {
  const trimmed = rawId.trim();
  const urlMatch = trimmed.match(/[0-9a-fA-F]{32}/);
  const compactId = urlMatch?.[0] ?? trimmed.replace(/-/g, "");

  if (/^[0-9a-fA-F]{32}$/.test(compactId)) {
    return [
      compactId.slice(0, 8),
      compactId.slice(8, 12),
      compactId.slice(12, 16),
      compactId.slice(16, 20),
      compactId.slice(20)
    ].join("-");
  }

  return trimmed;
}

function getPlainText(property?: NotionProperty): string {
  if (!property) return "";

  if (property.type === "title") {
    return (property.title ?? []).map((item) => item.plain_text ?? "").join("").trim();
  }

  if (property.type === "rich_text") {
    return (property.rich_text ?? []).map((item) => item.plain_text ?? "").join("").trim();
  }

  if (property.type === "select") {
    return property.select?.name?.trim() ?? "";
  }

  if (property.type === "multi_select") {
    return (property.multi_select ?? [])
      .map((item) => item.name?.trim() ?? "")
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function getMultiValue(property?: NotionProperty): string[] {
  if (!property) return [];

  if (property.type === "multi_select") {
    return (property.multi_select ?? [])
      .map((item) => item.name?.trim() ?? "")
      .filter(Boolean);
  }

  const singleValue = getPlainText(property);
  return singleValue ? [singleValue] : [];
}

function getTitle(properties: Record<string, NotionProperty>): string {
  const namedTitle = getPlainText(properties[PROPERTY_TITLE]);
  if (namedTitle) return namedTitle;

  const fallbackTitle = Object.values(properties).find((property) => property.type === "title");
  return getPlainText(fallbackTitle);
}

function mapWork(page: NotionPage): WorkItem | null {
  const properties = page.properties;
  if (!properties) return null;

  const title = getTitle(properties);
  if (!title) return null;

  return {
    title,
    industry: getPlainText(properties[PROPERTY_INDUSTRY]),
    responsibilities: getMultiValue(properties[PROPERTY_RESPONSIBILITIES]),
    technologies: getMultiValue(properties[PROPERTY_TECHNOLOGIES])
  };
}

async function notionRequest(path: string, notionVersion = NOTION_VERSION): Promise<NotionQueryResponse> {
  const apiKey = import.meta.env.NOTION_API_KEY;

  if (!apiKey) {
    return { results: [] };
  }

  const response = await fetch(`${NOTION_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": notionVersion
    },
    body: JSON.stringify({
      page_size: 100
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Notion works: ${response.status} ${errorText}`);
  }

  return (await response.json()) as NotionQueryResponse;
}

export async function getWorks(): Promise<WorksState> {
  const dataSourceId = import.meta.env.NOTION_DATA_SOURCE_ID;
  const databaseId = import.meta.env.NOTION_DATABASE_ID;

  if (!dataSourceId && !databaseId) {
    return {
      items: [],
      error: "NOTION_DATABASE_ID または NOTION_DATA_SOURCE_ID が未設定です。"
    };
  }

  try {
    const response = dataSourceId
      ? await notionRequest(`/data_sources/${normalizeNotionId(dataSourceId)}/query`)
      : await notionRequest(
          `/databases/${normalizeNotionId(databaseId)}/query`,
          NOTION_DATABASE_QUERY_VERSION
        );

    return {
      items: (response.results ?? [])
        .map(mapWork)
        .filter((work): work is WorkItem => work !== null),
      error: null
    };
  } catch (error) {
    console.error(error);
    return {
      items: [],
      error: error instanceof Error ? error.message : "Notion API の取得に失敗しました。"
    };
  }
}
