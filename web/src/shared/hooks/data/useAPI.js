// 플레이스홀더 API 훅
export const useAPI = () => {
  return {
    get: () => Promise.resolve({}),
    post: () => Promise.resolve({}),
    put: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
    loading: false,
    error: null
  };
};