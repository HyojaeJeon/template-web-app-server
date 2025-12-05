let _store = null;

export const setStore = (store) => {
  _store = store;
};

export const getStore = () => _store;

export default { setStore, getStore };

