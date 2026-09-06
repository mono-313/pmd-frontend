// components/HomeGrid/types.ts
export interface HomeBoxData {
  title: string;
  description: string;
  href: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}