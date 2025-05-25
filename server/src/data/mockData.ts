export const mockDataFeedback = {
  feedbacks: Array.from({ length: 50 }, (_, i) => {
    return {
      id: i + 1,
      postId: 100 + (i % 5),
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      body: `This is feedback number ${i + 1}. ${i % 2 === 0 ? 'Positive feedback.' : 'Constructive criticism.'}`,
    };
  }),
};
