export const transformSearchResults = (searchResults = []) => {
  return searchResults.map(result => {
    let emoji = '🍽️';
    let displayPrice = '';

    if (result.type === 'store') {
      emoji = '🏪';
      displayPrice = result.store?.deliveryFee ?
        `${result.store.deliveryFee.toLocaleString()}₫ 배달비` :
        '배달비 무료';
    } else if (result.type === 'menu_item') {
      emoji = '🍜';
      displayPrice = result.price ?
        `${result.price.toLocaleString()}₫` :
        '가격 문의';
    }

    return {
      id: result.id,
      type: result.type,
      emoji,
      name: result.name,
      description: result.description || '',
      rating: result.rating ? result.rating.toFixed(1) : '0.0',
      price: displayPrice,
      store: result.store,
      category: result.category,
      imageUrl: result.imageUrl};
  });
};

export const transformPopularSearches = (popularSearches = []) => {
  return popularSearches.map(search => ({
    ...search,
    count: typeof search.count === 'number' ?
      search.count > 1000 ? `${(search.count / 1000).toFixed(1)}k` : search.count.toString() :
      search.count}));
};

export const transformSearchCategories = (categories = []) => {
  return categories.map(category => ({
    ...category,
    icon: category.icon || getCategoryIcon(category.cuisineType),
    iconType: category.iconType || 'material'}));
};

const getCategoryIcon = (cuisineType) => {
  const iconMap = {
    'vietnamese': 'ramen-dining',
    'korean': 'store',
    'chinese': 'store-menu',
    'western': 'local-dining',
    'japanese': 'set-meal',
    'thai': 'rice-bowl',
    'dessert': 'cake',
    'drink': 'local-cafe'};

  return iconMap[cuisineType?.toLowerCase()] || 'store';
};
