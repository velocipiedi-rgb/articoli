export interface SubstackArticle {
  title: string;
  slug: string;
  link: string;
  pubDate: string;
  formattedDate: string;
  description: string;
  content: string;
  image: string;
  author: string;
}

export const SUBSTACK_FEED_URL = "https://velocipiedi.substack.com/feed";

export async function fetchSubstackArticles(feedUrl = SUBSTACK_FEED_URL): Promise<SubstackArticle[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.warn(`[Substack] HTTP ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const articles: SubstackArticle[] = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];

      const getTag = (tag: string) => {
        const cdata = itemXml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
        if (cdata) return cdata[1].trim();
        const normal = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
        return normal ? normal[1].trim() : '';
      };

      const title = getTag('title');
      const link = getTag('link');
      const pubDateRaw = getTag('pubDate');
      const author = getTag('dc:creator');
      const description = getTag('description');
      const fullContent = getTag('content:encoded') || description;

      // Estrazione slug dal link
      let slug = '';
      const urlMatch = link.match(/\/p\/([^/?#]+)/);
      if (urlMatch) {
        slug = urlMatch[1];
      } else {
        slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      }

      // Estrazione copertina
      let image = '';
      const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
      if (enclosureMatch) {
        image = enclosureMatch[1];
      } else {
        const imgMatch = fullContent.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) image = imgMatch[1];
      }

      // Formattazione data GG/MM/AAAA
      let formattedDate = '';
      if (pubDateRaw) {
        const d = new Date(pubDateRaw);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          formattedDate = `${day}/${month}/${year}`;
        }
      }

      if (title && slug) {
        articles.push({
          title,
          slug,
          link,
          pubDate: pubDateRaw,
          formattedDate: formattedDate || 'Recente',
            description,
            content: fullContent,
            image: image || '/images/milano_tram_1.jpeg',
            author: author || 'Velocipiedi'
        });
      }
    }

    return articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  } catch (error) {
    console.error("[Substack RSS Error]:", error);
    return [];
  }
}
