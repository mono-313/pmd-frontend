// components/HomeGrid/index.tsx
import { HomeBox } from './HomeBox';
import type { HomeBoxData } from './Types';

interface HomeGridProps {
  boxes: HomeBoxData[];
}

export function HomeGrid({ boxes }: HomeGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
      {boxes.map((box) => (
        <HomeBox key={box.href} {...box} />
      ))}
    </div>
  );
}