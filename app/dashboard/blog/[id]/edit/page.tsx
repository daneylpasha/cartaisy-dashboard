'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from '@/lib/auth';
import { useDropzone } from 'react-dropzone';
import { useBlog, updateBlogPost, deleteBlogPost } from '@/hooks/useBlog';
import { generateSlug } from '@/lib/utils/slug';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import TiptapEditor from '@/components/blog/TiptapEditor';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  ArrowLeft,
  Loader2,
  ShieldX,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Upload,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === 'super_admin';

  const { blog, loading: blogLoading, error: blogError } = useBlog(blogId);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [showSeo, setShowSeo] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Populate form when blog data loads
  useEffect(() => {
    if (blog) {
      setTitle(blog.title);
      setSlug(blog.slug);
      setContent(blog.content);
      setExcerpt(blog.excerpt);
      setFeaturedImage(blog.featuredImage || '');
      setCategory(blog.category || '');
      setTags(blog.tags || []);
      setStatus(blog.status);
      setMetaTitle(blog.metaTitle || '');
      setMetaDescription(blog.metaDescription || '');
    }
  }, [blog]);

  // Handle tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Image upload with react-dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      setFeaturedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1,
  });

  // Form submission
  const handleSubmit = async (newStatus?: 'draft' | 'published') => {
    setError('');
    setSuccess('');

    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    if (!excerpt.trim()) {
      setError('Excerpt is required');
      return;
    }

    if (excerpt.length > 300) {
      setError('Excerpt must be 300 characters or less');
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: any = {
        title: title.trim(),
        slug: slug.trim(),
        content: content.trim(),
        excerpt: excerpt.trim(),
        featuredImage: featuredImage || null,
        category: category.trim() || null,
        tags,
        metaTitle: metaTitle.trim() || null,
        metaDescription: metaDescription.trim() || null,
      };

      if (newStatus) {
        updateData.status = newStatus;
      }

      await updateBlogPost(blogId, updateData);

      setSuccess('Blog post updated successfully!');

      setTimeout(() => {
        router.push('/dashboard/blog');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update blog post');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBlogPost(blogId);
      router.push('/dashboard/blog');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete blog post');
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Access denied
  if (!isSuperAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="rounded-xl border-2 border-dashed border-red-200 bg-red-50/50 p-12 max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (blogLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-3" />
          <p className="text-slate-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (blogError || !blog) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="rounded-xl border-2 border-dashed border-red-200 bg-red-50/50 p-12 max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-red-900 mb-2">Blog Not Found</h2>
          <p className="text-red-700 mb-4">{blogError || 'The blog post could not be found.'}</p>
          <Link href="/dashboard/blog">
            <Button>Back to Blog List</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/blog">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Blog Post</h1>
            <p className="text-sm text-slate-500">Update your blog post</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowDeleteDialog(true)}
          className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter blog post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 text-lg"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">/blog/</span>
                <Input
                  id="slug"
                  placeholder="url-friendly-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label>Content *</Label>
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder="Write your blog content here..."
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="excerpt">Excerpt *</Label>
                <span className={`text-xs ${excerpt.length > 300 ? 'text-red-500' : 'text-slate-500'}`}>
                  {excerpt.length}/300
                </span>
              </div>
              <Textarea
                id="excerpt"
                placeholder="A short description for blog cards..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="min-h-[80px]"
                maxLength={300}
              />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* Status Badge */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Current Status:</span>
              {status === 'published' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Draft
                </span>
              )}
            </div>
          </Card>

          {/* Featured Image */}
          <Card className="p-6 space-y-4">
            <Label>Featured Image</Label>
            {featuredImage ? (
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full h-40 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFeaturedImage('')}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-600">
                  Drag & drop or <span className="text-violet-600 font-medium">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
              </div>
            )}
          </Card>

          {/* Category & Tags */}
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Mobile Commerce"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Type and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* SEO */}
          <Card className="p-6">
            <button
              type="button"
              onClick={() => setShowSeo(!showSeo)}
              className="flex items-center justify-between w-full text-left"
            >
              <Label className="cursor-pointer">SEO Settings</Label>
              {showSeo ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showSeo && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <span className={`text-xs ${metaTitle.length > 70 ? 'text-red-500' : 'text-slate-500'}`}>
                      {metaTitle.length}/70
                    </span>
                  </div>
                  <Input
                    id="metaTitle"
                    placeholder="SEO title (defaults to post title)"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    maxLength={70}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <span className={`text-xs ${metaDescription.length > 160 ? 'text-red-500' : 'text-slate-500'}`}>
                      {metaDescription.length}/160
                    </span>
                  </div>
                  <Textarea
                    id="metaDescription"
                    placeholder="SEO description (defaults to excerpt)"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="min-h-[80px]"
                    maxLength={160}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Actions */}
          <Card className="p-6 space-y-3">
            <Button
              onClick={() => handleSubmit(status === 'draft' ? 'published' : undefined)}
              disabled={isSubmitting}
              className="w-full gap-2 bg-slate-900 hover:bg-slate-800"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === 'draft' ? 'Publish' : 'Update'}
            </Button>
            {status === 'published' && (
              <Button
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={isSubmitting}
                className="w-full"
              >
                Unpublish (Save as Draft)
              </Button>
            )}
            {status === 'draft' && (
              <Button
                variant="outline"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="w-full"
              >
                Save Draft
              </Button>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{blog.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
