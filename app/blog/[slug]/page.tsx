import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Clock,
  Share2,
  BookOpen,
  Folder,
  TrendingUp,
} from 'lucide-react';
import PageLayout from '@/components/landing/PageLayout';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { ArticleSchema, BreadcrumbSchema } from '@/components/landing/StructuredData';
import { siteConfig } from '@/lib/seo';
import { getBlogBySlug, getRelatedPosts, getAllTags, getAllCategories, getPublishedBlogs } from '@/lib/services/blog';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  tags: string[];
  category: string | null;
  author: string;
  status: string;
  publishedAt: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

async function getBlogPost(slug: string): Promise<{ data: BlogPost; relatedPosts: BlogPost[] } | null> {
  try {
    const blog = await getBlogBySlug(slug);
    if (blog.status !== 'published') return null;
    const relatedPosts = await getRelatedPosts(slug, 5);
    return { data: blog, relatedPosts };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const response = await getBlogPost(slug);

  if (!response) {
    return {
      title: 'Blog Post Not Found | Cartaisy',
    };
  }

  const post = response.data;
  const cleanTitle = (post.metaTitle || post.title).replace(/\s*Slug:.*$/i, '');
  const title = cleanTitle;
  const description = post.metaDescription || post.excerpt;
  const image = post.featuredImage || siteConfig.ogImage;

  return {
    title: `${title} | ${siteConfig.name}`,
    description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    openGraph: {
      type: 'article',
      locale: 'en_US',
      url: `${siteConfig.url}/blog/${post.slug}`,
      siteName: siteConfig.name,
      title,
      description,
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
      creator: siteConfig.twitterHandle,
      site: siteConfig.twitterHandle,
    },
  };
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function calculateReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(words / 200);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [response, tags, categories, recentResult] = await Promise.all([
    getBlogPost(slug),
    getAllTags(),
    getAllCategories(),
    getPublishedBlogs(1, 5),
  ]);

  if (!response) {
    notFound();
  }

  const post = response.data;
  const relatedPosts = response.relatedPosts || [];
  const recentPosts = recentResult.data.filter((p: any) => p.slug !== slug).slice(0, 4);
  const readingTime = calculateReadingTime(post.content);
  const shareUrl = `${siteConfig.url}/blog/${post.slug}`;

  return (
    <>
      {/* Structured Data */}
      <ArticleSchema
        title={post.title}
        description={post.excerpt}
        url={shareUrl}
        image={post.featuredImage || undefined}
        author={post.author}
        publishedAt={post.publishedAt}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: siteConfig.url },
          { name: 'Blog', url: `${siteConfig.url}/blog` },
          { name: post.title, url: shareUrl },
        ]}
      />

      <PageLayout showBackLink={false} maxWidth="6xl">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Featured Image - Full Width */}
        {post.featuredImage && (
          <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            {post.category && (
              <span className="absolute top-4 left-4 px-4 py-2 bg-purple-600/90 text-white text-sm font-medium rounded-full">
                {post.category}
              </span>
            )}
          </div>
        )}

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Article Header */}
            <header className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                {post.title.replace(/\s*Slug:.*$/i, '')}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm mb-4">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{readingTime} min read</span>
                </div>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: string) => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded-full transition-colors"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </header>

            {/* Article Content */}
            <article
              className="prose prose-invert max-w-none mb-10 text-gray-300 text-base leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-purple-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-400 [&_blockquote]:my-4 [&_a]:text-purple-400 [&_a]:underline [&_a:hover]:text-purple-300 [&_strong]:text-white [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-white/5 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_hr]:border-white/10 [&_hr]:my-6"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <section className="border-t border-white/10 pt-8">
                <h2 className="text-xl font-bold text-white mb-6">Related Posts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedPosts.slice(0, 4).map((relatedPost: BlogPost) => (
                    <Link
                      key={relatedPost.id}
                      href={`/blog/${relatedPost.slug}`}
                      className="group flex gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all"
                    >
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-purple-600/20 to-blue-600/20 overflow-hidden">
                        {relatedPost.featuredImage ? (
                          <img
                            src={relatedPost.featuredImage}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-purple-400/50" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                          {relatedPost.title.replace(/\s*Slug:.*$/i, '')}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(relatedPost.publishedAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Categories */}
              {categories.length > 0 && (
                <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Folder className="w-4 h-4 text-purple-400" />
                    Categories
                  </h3>
                  <div className="space-y-1">
                    {categories.map((cat: string) => (
                      <Link
                        key={cat}
                        href={`/blog?category=${encodeURIComponent(cat)}`}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          post.category === cat
                            ? 'bg-purple-600/20 text-purple-300'
                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                        }`}
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {(tags.length > 0 || post.tags.length > 0) && (
                <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-400" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set([...tags, ...post.tags])].map((t: string) => (
                      <Link
                        key={t}
                        href={`/blog?tag=${encodeURIComponent(t)}`}
                        className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                          post.tags.includes(t)
                            ? 'bg-purple-600/20 text-purple-300'
                            : 'bg-white/10 text-gray-400 hover:bg-white/15 hover:text-gray-300'
                        }`}
                      >
                        {t}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Posts */}
              {recentPosts.length > 0 && (
                <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    Recent Posts
                  </h3>
                  <div className="space-y-3">
                    {recentPosts.map((recent: any) => (
                      <Link
                        key={recent.id}
                        href={`/blog/${recent.slug}`}
                        className="group block"
                      >
                        <h4 className="text-sm text-gray-300 group-hover:text-purple-400 transition-colors line-clamp-2">
                          {recent.title.replace(/\s*Slug:.*$/i, '')}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(recent.publishedAt)}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Widget */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-purple-400" />
                  Share
                </h3>
                <ShareButtons url={shareUrl} title={post.title} />
              </div>
            </div>
          </aside>
        </div>
      </PageLayout>
    </>
  );
}
