
export interface Feedback {
  id: number;
  name: string;
  email: string;
  body: string;
  postId: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}