import type { APIRoute } from 'astro';
import { fetchSubstackArticles } from '../../utils/substack';

export const GET: APIRoute = async () => {
  const articles = await fetchSubstackArticles();


  const searchIndex = articles.map((a) => ({
    title: a.title,
    slug: a.slug,
    image: a.image,
    formattedDate: a.formattedDate,
    description: (a.description || '')
      .replace(/<[^>]*>?/gm, '')
      .slice(0, 130) + '...',
  }));

  return new Response(JSON.stringify(searchIndex), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
