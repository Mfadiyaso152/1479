import React from 'react';
import { 
  Briefcase, 
  Sparkles, 
  TrendingUp, 
  Gift, 
  Utensils, 
  Home, 
  ShoppingBag, 
  Car, 
  Film, 
  HeartPulse, 
  CreditCard, 
  Tag 
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function CategoryIcon({ name, className = '', size = 20 }: CategoryIconProps) {
  switch (name) {
    case 'Briefcase':
      return <Briefcase className={className} size={size} />;
    case 'Sparkles':
      return <Sparkles className={className} size={size} />;
    case 'TrendingUp':
      return <TrendingUp className={className} size={size} />;
    case 'Gift':
      return <Gift className={className} size={size} />;
    case 'Utensils':
      return <Utensils className={className} size={size} />;
    case 'Home':
      return <Home className={className} size={size} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} size={size} />;
    case 'Car':
      return <Car className={className} size={size} />;
    case 'Film':
      return <Film className={className} size={size} />;
    case 'HeartPulse':
      return <HeartPulse className={className} size={size} />;
    case 'CreditCard':
      return <CreditCard className={className} size={size} />;
    default:
      return <Tag className={className} size={size} />;
  }
}
