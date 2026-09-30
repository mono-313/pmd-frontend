import { API_CONFIG } from "@/app/lib/api-config";
import {
  forbidden,
  getAccessToken,
  isCurrentUserAdmin,
  parseBackendResponse,
  unauthorized,
} from "@/app/lib/profile-server";

export async function GET() {
  const token = await getAccessToken();
  if (!token) return unauthorized();
  if (!(await isCurrentUserAdmin(token))) return forbidden();

  const response = await fetch(`${API_CONFIG.baseUrl}/roles`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseBackendResponse(response);
}
