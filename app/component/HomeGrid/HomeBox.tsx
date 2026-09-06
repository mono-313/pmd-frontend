// components/HomeGrid/HomeBox.tsx
import Link from 'next/link';
import type { HomeBoxData} from './Types'

interface HomeBoxProps extends HomeBoxData {}
//تعریف رنگ های مد نظر استفاده شده برای اینترفیس
const colorMap: Record<NonNullable<HomeBoxData['color']>, string> = {
  blue: 'hover:border-blue-500 hover:text-blue-600',
  green: 'hover:border-green-500 hover:text-green-600',
  purple: 'hover:border-purple-500 hover:text-purple-600',
  orange: 'hover:border-orange-500 hover:text-orange-600',
};

//تعریف تابع استفاده از اینترنفیس
export function HomeBox({
  title,
  description,
  href,
  icon,
  color = 'blue',
}: HomeBoxProps) {
  
  return (
    <Link
      href={href}
      className={`
        group block bg-white rounded-2xl shadow-md 
        hover:shadow-xl transition-all duration-200 
        p-6 text-center border border-gray-100
        ${colorMap[color]}
      `}
    >
      {icon && (
        <div className="text-2xl group-scale-90 transition-transform ">
          {icon}
        </div>
      )}
      <span className="text-xl font-semibold text-gray-900 mb-2">{title}</span>
      <p className="text-gray-600 text-sm">{description}</p>
    </Link>
  );
}