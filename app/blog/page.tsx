import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Tag, Calendar, User, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import PageLayout from '@/components/landing/PageLayout';
import { generateMetadata as genMeta } from '@/lib/seo';
import { getPublishedBlogs, getAllTags } from '@/lib/services/blog';

export const metadata: Metadata = genMeta({
  title: 'Blog',
  description: 'Mobile commerce insights, Shopify tips, conversion strategies, and Cartaisy product updates. Learn how to grow your mobile sales.',
  keywords: ['blog', 'mobile commerce', 'ecommerce tips', 'Shopify tips'],
});

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const tag = params.tag;
  const category = params.category;

  const [blogsResponse, tags] = await Promise.all([
    getPublishedBlogs(page, 9, tag, category),
    getAllTags(),
  ]);

  const { data: blogs, pagination } = blogsResponse;

  return (
    <PageLayout showBackLink={false} maxWidth="6xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full mb-6">
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 text-sm font-medium">Cartaisy Blog</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Insights & Updates
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Expert tips on mobile commerce, Shopify optimization, and growing your online business.
        </p>
      </div>

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <Link
            href="/blog"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !tag
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            All
          </Link>
          {tags.map((t) => (
            <Link
              key={t}
              href={`/blog?tag=${encodeURIComponent(t)}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tag === t
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {/* Blog Grid */}
      {blogs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">No Posts Yet</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            {tag
              ? `No posts found with the tag "${tag}".`
              : 'We\'re working on bringing you valuable content. Check back soon!'}
          </p>
          {tag && (
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              View All Posts
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {blogs.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all hover:transform hover:-translate-y-1"
              >
                {/* Featured Image */}
                <div className="relative h-48 bg-gradient-to-br from-purple-600/20 to-blue-600/20">
                  {post.featuredImage ? (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-purple-400/50" />
                    </div>
                  )}
                  {post.category && (
                    <span className="absolute top-4 left-4 px-3 py-1 bg-purple-600/90 text-white text-xs font-medium rounded-full">
                      {post.category}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.publishedAt)}
                    </div>
                    <div className="flex items-center gap-1 text-purple-400 font-medium group-hover:gap-2 transition-all">
                      Read More
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              {page > 1 && (
                <Link
                  href={`/blog?page=${page - 1}${tag ? `&tag=${tag}` : ''}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Link>
              )}

              <span className="text-gray-400">
                Page {page} of {pagination.totalPages}
              </span>

              {page < pagination.totalPages && (
                <Link
                  href={`/blog?page=${page + 1}${tag ? `&tag=${tag}` : ''}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}
