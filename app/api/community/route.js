import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAuthUser } from '@/lib/auth';

const DATA_DIR = path.join(process.cwd(), 'data');
const COMMUNITY_FILE = path.join(DATA_DIR, 'community_posts.json');

function ensureCommunityFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(COMMUNITY_FILE)) {
    fs.writeFileSync(COMMUNITY_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    ensureCommunityFile();
    const data = fs.readFileSync(COMMUNITY_FILE, 'utf-8');
    const posts = JSON.parse(data) || [];
    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json({ posts: [] });
  }
}

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, content, category } = await req.json();
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Post title is required' }, { status: 400 });
    }

    ensureCommunityFile();
    const data = fs.readFileSync(COMMUNITY_FILE, 'utf-8');
    const posts = JSON.parse(data) || [];

    const newPost = {
      id: Date.now(),
      userId: user.id,
      author: user.name || 'Learner',
      avatar: user.name ? user.name[0].toUpperCase() : 'U',
      title: title.trim(),
      content: content ? content.trim() : '',
      category: category || 'Study Tips',
      upvotes: 1,
      comments: 0,
      time: 'Just now',
      createdAt: new Date().toISOString()
    };

    posts.unshift(newPost);
    fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(posts, null, 2), 'utf-8');

    return NextResponse.json({ post: newPost }, { status: 201 });
  } catch (error) {
    console.error('Community POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
