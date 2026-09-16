import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const guidesDirectory = path.join(process.cwd(), 'content', 'guides');

/**
 * Retrieves all guide slugs from the content/guides directory.
 */
export function getGuideSlugs() {
  if (!fs.existsSync(guidesDirectory)) return [];
  return fs
    .readdirSync(guidesDirectory)
    .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
    .map((file) => file.replace(/\.mdx?$/, ''));
}

/**
 * Retrieves a single guide's metadata and content by its slug.
 */
export function getGuideBySlug(slug) {
  const cleanSlug = slug.replace(/\.mdx?$/, '');
  const mdxPath = path.join(guidesDirectory, `${cleanSlug}.mdx`);
  const mdPath = path.join(guidesDirectory, `${cleanSlug}.md`);

  const filePath = fs.existsSync(mdxPath) ? mdxPath : (fs.existsSync(mdPath) ? mdPath : null);
  if (!filePath) return null;

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);

  return {
    slug: cleanSlug,
    data: {
      title: data.title || 'Student Guide',
      description: data.description || '',
      date: data.date || '',
      author: data.author || 'AfroEduGo Team',
      readTime: data.readTime || '5 min read',
      tags: Array.isArray(data.tags) ? data.tags : [],
      coverEmoji: data.coverEmoji || '📚',
      ...data,
    },
    content,
  };
}

/**
 * Retrieves all guides sorted by date descending.
 */
export function getAllGuides() {
  const slugs = getGuideSlugs();
  const guides = slugs
    .map((slug) => getGuideBySlug(slug))
    .filter(Boolean)
    .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));

  return guides;
}
