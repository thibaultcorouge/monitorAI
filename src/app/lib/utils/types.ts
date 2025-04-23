// lib/utils/types.ts
export interface UserData {
    uid?: string;
    email: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
    createdAt: string;
    authId?: string;
    lastConnection?: string;
  }
  
  export interface Article {
    id?: string;
    title: string;
    description: string;
    author?: string;
    link: string;
    pubDate: string;
    image?: string;
    source: string;
    guid: string;
    categories: string[];
    language?: string;
    createdAt: string;
  }
  
  export interface RSSFeed {
    id?: string;
    name: string;
    url: string;
    createdAt?: string;
    language?: string;
    isGeneric?: boolean;
  }