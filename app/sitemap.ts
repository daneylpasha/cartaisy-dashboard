import { MetadataRoute } from 'next';
import { connectToDatabase } from '@/lib/db';
import { BlogPost } from '@/models/BlogPost';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://cartaisy.com';

  // Static pages with their priorities and change frequencies
  const staticPages = [
    { route: '', priority: 1, changeFrequency: 'weekly' as const },
    { route: '/features', priority: 0.9, changeFrequency: 'monthly' as const },
    { route: '/pricing', priority: 0.9, changeFrequency: 'monthly' as const },
    { route: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
    { route: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
    { route: '/schedule-demo', priority: 0.8, changeFrequency: 'monthly' as const },
    { route: '/docs', priority: 0.8, changeFrequency: 'weekly' as const },
    { route: '/docs/api', priority: 0.7, changeFrequency: 'monthly' as const },
    { route: '/docs/quickstart', priority: 0.7, changeFrequency: 'monthly' as const },
    { route: '/docs/shopify', priority: 0.7, changeFrequency: 'monthly' as const },
    { route: '/docs/faq', priority: 0.7, changeFrequency: 'monthly' as const },
    { route: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { route: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
    { route: '/cookies', priority: 0.3, changeFrequency: 'yearly' as const },
    { route: '/blog', priority: 0.6, changeFrequency: 'weekly' as const },
    { route: '/careers', priority: 0.5, changeFrequency: 'monthly' as const },
    { route: '/newsletter', priority: 0.5, changeFrequency: 'monthly' as const },
  ];

  const staticSitemap: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${baseUrl}${page.route}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // Fetch published blog posts for dynamic sitemap entries
  let blogSitemap: MetadataRoute.Sitemap = [];

  try {
    await connectToDatabase();

    const publishedPosts = await BlogPost.find({ status: 'published' })
      .select('slug updatedAt')
      .lean();

    blogSitemap = publishedPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Failed to fetch blog posts for sitemap:', error);
  }

  return [...staticSitemap, ...blogSitemap];
}
