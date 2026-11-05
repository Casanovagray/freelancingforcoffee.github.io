// Reference types for the `posts` table (documentation only — the site is plain JS).
// Row columns: id, type, title, post_date, tags, featured, created_at, updated_at, data (jsonb).
// api.js flattens a row into the objects below (post_date -> date, data.* hoisted).

interface PostBase {
  id: string;            // uuid
  title: string;
  date: string | null;   // "YYYY-MM-DD"
  tags: string[];        // GIN-indexed text[]
}

interface PhotographyPost extends PostBase {
  type: "photography";
  client: string;
  description: string;
  thumbnail: string;     // public URL or site-relative path
  images: string[];      // carousel array, in display order
  featured: false;
}

interface JournalismPost extends PostBase {
  type: "journalism";
  dek: string;           // subheadline
  byline: string;
  heroImage: string;
  heroCredit: string;
  bodyHtml: string;      // sanitised HTML; embedded images are <figure><img><figcaption>Credit: …</figcaption></figure>
  featured: boolean;     // at most ONE row is true (trigger + unique index)
}

type Platform = "YouTube" | "TikTok" | "Instagram Reels" | "Facebook" | "X/Twitter";

interface VideoPost extends PostBase {
  type: "video";
  role: string;
  description: string;
  embedUrl: string;      // https link, <iframe> snippet, or .mp4 URL (validated by toEmbed())
  platforms: Platform[];
  metrics: { views: number; likes: number; shares: number; comments: number };
  featured: false;
}

type Post = PhotographyPost | JournalismPost | VideoPost;
