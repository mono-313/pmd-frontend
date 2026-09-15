// app/page.tsx

"use client"
import { HomeGrid } from '../component/HomeGrid';
import type { HomeBoxData } from '../component/HomeGrid/Types';
import { Mail, Eye, TrendingUpDown, CalendarCheck, RefreshCcw, CircleCheckBig } 
 from 'lucide-react';
import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
 import {
  redirect,
} from "next/navigation";



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
    title: 'کارتابل ارجاعات',
    description: 'پیش بینی در انتظار بررسی',
    href: '../forecasts/review',
    icon: <Mail /> ,
    color: 'blue',
  },
  {
    title: 'پیش بینی موضوع',
    description: 'ثبت پیش بینی جدید',
    href: '../wizard',
    icon: <TrendingUpDown />,
    color: 'blue',
  },
  {
    title: 'موضوع تایید شده',
    description: 'در انتظار صدور شناسنامه',
    href: '../approved-forecasts',
    icon: <CalendarCheck />,
    color: 'blue',
  },
  {
    title: 'شناسنامه ارجاع شده',
    description: 'شناسنامه در انتظار بررسی',
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
   const router =
    useRouter();

  const [
    isCheckingSession,
    setIsCheckingSession,
  ] = useState(true);


  useEffect(() => {
    const storedSession =
      localStorage.getItem(
        "pmd-user-session"
      );

    if (!storedSession) {
      router.replace("/login");
      return;
    }

    try {
      const session =
        JSON.parse(
          storedSession
        ) as {
          expiresAt?: string;
        };

      const expiresAt =
        session.expiresAt
          ? new Date(
              session.expiresAt
            ).getTime()
          : Number.NaN;

      if (
        !Number.isFinite(
          expiresAt
        ) ||
        expiresAt <= Date.now()
      ) {
        localStorage.removeItem(
          "pmd-user-session"
        );

        router.replace("/login");
        return;
      }

      setIsCheckingSession(false);
    } catch {
      localStorage.removeItem(
        "pmd-user-session"
      );

      router.replace("/login");
    }
  }, [router]);


  if (isCheckingSession) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-gray-50
          text-gray-500
        "
        dir="rtl"
      >
        در حال بررسی اطلاعات کاربر...
      </main>
    );
  }


  return (
    <main className=" bg-gray-50 flex flex-col items-center justify-center p-6">
      {/* <h1 className="text-3xl font-bold mb-8 text-gray-800">
       به سامانه موج پلاس خوش آمدید
      </h1> */}
      <HomeGrid boxes={boxes} />
    </main>
    );
  }
