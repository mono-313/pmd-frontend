import { NextResponse } from "next/server";

import { API_CONFIG } from "@/app/lib/api-config";
import {
  getAccessToken,
  parseBackendResponse,
  unauthorized,
} from "@/app/lib/profile-server"

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 2 * 1024 * 1024;

export async function GET() {
  const token = await getAccessToken();
  if (!token) return unauthorized();

  const profileResponse = await fetch(`${API_CONFIG.baseUrl}/auth/profile`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!profileResponse.ok) return parseBackendResponse(profileResponse);

  const profile = await profileResponse.json();
  const relativePath = profile?.profilePictureUrl ?? profile?.data?.profilePictureUrl;
  if (!relativePath) {
    return NextResponse.json({ message: "تصویر پروفایل ثبت نشده است." }, { status: 404 });
  }

  const backendOrigin = new URL(API_CONFIG.baseUrl).origin;
  const imageUrl = new URL(String(relativePath), backendOrigin);
  if (imageUrl.origin !== backendOrigin) {
    return NextResponse.json({ message: "آدرس تصویر نامعتبر است." }, { status: 400 });
  }

  const imageResponse = await fetch(imageUrl, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!imageResponse.ok) {
    return NextResponse.json({ message: "دریافت تصویر ممکن نشد." }, { status: imageResponse.status });
  }

  return new NextResponse(await imageResponse.arrayBuffer(), {
    status: 200,
    headers: {
      "Content-Type": imageResponse.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "private, no-store",
    },
  });
}

export async function POST(request: Request) {
  const token = await getAccessToken();
  if (!token) return unauthorized();

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "فایل تصویر ارسال نشده است." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_SIZE) {
    return NextResponse.json(
      { message: "فقط JPG، PNG یا WEBP تا حجم ۲ مگابایت مجاز است." },
      { status: 400 }
    );
  }

  const backendForm = new FormData();
  backendForm.append("file", file, file.name);

  const response = await fetch(`${API_CONFIG.baseUrl}/auth/profile/picture`, {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    body: backendForm,
    cache: "no-store",
  });

  return parseBackendResponse(response);
}
