"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";


export default function Sidebar() {

const [openPredict, setOpenPredict] = useState(false);
const [openShenas, setOpenShenas] = useState(false);
const pathname = usePathname();

  return (


    <aside className="w-64 bg-gray-200 p-4 min-h-screen border-l border-black-300 shadow-lg">

      <ul className="space-y-3">
{/** صفحه اصلی */}
        <li>
          <Link 
                
                href="/"
                
                className=
                {`block rounded-md px-3 py-2 transition
                  ${
                      pathname === "/"
                          ? "bg-[#007fcf] text-white"
                          : "hover:bg-[#007fcf] hover:text-white transition duration-300"
                    }
                `}
                >صفحه اصلی
              </Link>
        </li>

       
{/*منوی پیش بینی موضوعی */}
        <li>
            <button
              onClick={() => setOpenPredict(!openPredict)}
              className="flex justify-between items-center w-full  rounded-lg px-4 py-3 hover:bg-[#007fcf] hover:text-white transition duration-300"
            >

              <span>پیش بینی موضوعات</span>

              <ChevronDown
                className={`transition-transform duration-300 ${
                  openPredict ? "rotate-180" 
                  : ""
                }`}
                size={18}
              />

            </button>

              {openPredict && (

                <ul className="mt-2 mr-5 space-y-2 border-r-2 border-gray-300 pr-3">

                  <li>
                    <Link
                    
                        href="../wizard"
                        className="block rounded-md px-3 py-2 hover:bg-blue-100">
                    
                    درج پیش بینی جدید
                    </Link>
                  </li>
                  <li>
                      <Link
                        href="../forecasts"
                        className="block rounded-md px-3 py-2 hover:bg-blue-100">
                            لیست پیش بینی‌ها
                              </Link>
                  </li>

                  <li>
                    <Link
                                href="../forecasts/review"
                                className="block rounded-md px-3 py-2 hover:bg-blue-100"
                              >
                             کارتابل ارجاعات موضوعی
                    </Link>
                  </li>
                  
                  <li>
                      <Link
                        href="../approved-forecasts"
                        className="block rounded-md px-3 py-2 hover:bg-blue-100">
                             موضوعات تایید شده
                              </Link>
                  </li>


                  
                              
                </ul>
              )}

                  </li>


{/*منوی شناسنامه برنامه */}
        <li>
            <button
              onClick={() => setOpenShenas(!openShenas)}
              className="flex justify-between items-center w-full  rounded-lg px-4 py-3 hover:bg-[#007fcf] hover:text-white transition duration-300"
            >

              <span>شناسنامه برنامه</span>

              <ChevronDown
                className={`transition-transform duration-300 ${
                  openShenas ? "rotate-180" 
                  : ""
                }`}
                size={18}
              />

            </button>

            {openShenas && (

              <ul className="mt-2 mr-5 space-y-2 border-r-2 border-gray-300 pr-3">

                <li>
                  <Link
                    href="../program-profiles"
                    className="block rounded-md px-3 py-2 hover:bg-blue-100"
                    
                  >
                 لیست شناسنامه‌ها
                  </Link>
                </li>

                <li>
                  <Link
                    href=""
                    className="block rounded-md px-3 py-2 hover:bg-blue-100"
                  >
                شناسنامه تایید شده
                  </Link>
                </li>

                <li>
                  <Link
                    href=""
                    className="block rounded-md px-3 py-2 hover:bg-blue-100"
                  >
                    کارتابل ارجاعات شناسنامه
                  </Link>
                </li>
              </ul>
            )}

      </li>

{/**گزارشات*/}
        <li>
          <Link href="/about"
              className=
              {`block rounded-md px-3 py-2 transition
                ${
                pathname === "/about"
                    ? "bg-[#007fcf] text-white"
                    : "hover:bg-[#007fcf] hover:text-white transition duration-300"
                  }
              `}
              
            >گزارشات
          </Link>
        </li>

{/*راهنما*/}
        <li>
          <Link href=""
          
          className={`block rounded-md px-3 py-2 transition
        ${
            pathname === ""
                ? "bg-[#007fcf] text-white"
                : "hover:bg-[#007fcf] hover:text-white transition duration-300"
        }
    `}
          > راهنما</Link>
        </li>
        
      </ul>

    </aside>
  );
}