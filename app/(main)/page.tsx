// app/page.tsx
import { HomeGrid } from '../component/HomeGrid';
import type { HomeBoxData } from '../component/HomeGrid/Types';
import { Mail, Eye, TrendingUpDown, CalendarCheck, RefreshCcw, CircleCheckBig } 
 from 'lucide-react';




const mail = () => {
  return (
    <Mail />
  );
};

const App = () => {
  return (
    <Eye />
  );
};

const TrendingUp = () => {
  return (
    <TrendingUpDown />
  );
};

const Calendar = () => {
  return (
    <CalendarCheck />
  );
};

const Ref = () => {
  return (
    <RefreshCcw />
  );
};

const Circle = () => {
  return (
    <CircleCheckBig />
  );
};



// آیکون‌ها را می‌توانی از lucide-react یا heroicons بگیری
const boxes: HomeBoxData[] = [
  {
    title: 'طرح پیشنهادی',
    description: '',
    href: '/z',
    icon: <Mail /> ,
    color: 'blue',
  },
  {
    title: 'پیش بینی موضوع',
    description: '',
    href: '/v',
    icon: <TrendingUpDown />,
    color: 'blue',
  },
  {
    title: 'موضوع تایید شده',
    description: '',
    href: '/x',
    icon: <CalendarCheck />,
    color: 'blue',
  },
  {
    title: 'شناسنامه ارجاع شده',
    description: '',
    href: '/Y',
    icon: <RefreshCcw />,
    color: 'blue',
  },
   {
    title:'شناسنامه نظارت شده',
    description: '',
    href: '/f',
    icon: <Eye />,
    color: 'blue',
  },
   {
    title:'شناسنامه تایید شده',
    description: '',
    href: '/h',
    icon: <CircleCheckBig />,
    color: 'blue',
  },
];

export default function HomePage() {
  return (
    <main className=" bg-gray-50 flex flex-col items-center justify-center p-6">
      {/* <h1 className="text-3xl font-bold mb-8 text-gray-800">
       به سامانه موج پلاس خوش آمدید
      </h1> */}
      <HomeGrid boxes={boxes} />
    </main>
  );
}