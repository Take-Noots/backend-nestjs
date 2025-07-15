export interface SearchResult {
  id: string;
  name: string;
  type: 'user' | 'fanbase' | 'post' | 'songPost' | 'profile';
}
