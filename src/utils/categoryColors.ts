import type { ListingType, ListingCategory } from '../types/database';

export function getCategoryColor(type: ListingType, category: ListingCategory) {
  if (type === 'offer' && category === 'house') {
    return {
      bg: 'bg-house-400',
      text: 'text-house-900',
      border: 'border-house-400',
      bgLight: 'bg-house-50',
      bgHover: 'hover:bg-house-100',
      gradient: 'from-house-100 to-house-200',
    };
  }

  if (type === 'offer' && category === 'hotel') {
    return {
      bg: 'bg-hotel-500',
      text: 'text-hotel-900',
      border: 'border-hotel-500',
      bgLight: 'bg-hotel-50',
      bgHover: 'hover:bg-hotel-100',
      gradient: 'from-hotel-100 to-hotel-200',
    };
  }

  if (type === 'request' && category === 'house') {
    return {
      bg: 'bg-houseSitter-400',
      text: 'text-houseSitter-900',
      border: 'border-houseSitter-400',
      bgLight: 'bg-houseSitter-50',
      bgHover: 'hover:bg-houseSitter-100',
      gradient: 'from-houseSitter-100 to-houseSitter-200',
    };
  }

  if (type === 'request' && category === 'hotel') {
    return {
      bg: 'bg-hotelSitter-400',
      text: 'text-hotelSitter-900',
      border: 'border-hotelSitter-400',
      bgLight: 'bg-hotelSitter-50',
      bgHover: 'hover:bg-hotelSitter-100',
      gradient: 'from-hotelSitter-100 to-hotelSitter-200',
    };
  }

  return {
    bg: 'bg-primary-600',
    text: 'text-primary-900',
    border: 'border-primary-600',
    bgLight: 'bg-primary-50',
    bgHover: 'hover:bg-primary-100',
    gradient: 'from-primary-100 to-primary-200',
  };
}

export function getCategoryLabel(type: ListingType, category: ListingCategory) {
  if (type === 'offer' && category === 'house') {
    return 'House';
  }
  if (type === 'offer' && category === 'hotel') {
    return 'Hotel';
  }
  if (type === 'request' && category === 'house') {
    return 'House Sitter';
  }
  if (type === 'request' && category === 'hotel') {
    return 'Hotel Sitter';
  }
  return 'Listing';
}
