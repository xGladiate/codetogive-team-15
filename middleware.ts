// import { updateSession } from "@/lib/supabase/middleware";
// import { type NextRequest } from "next/server";

// export async function middleware(request: NextRequest) {
//   return await updateSession(request);
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
//      * Feel free to modify this pattern to include more paths.
//      */
//     "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
//   ],
// };

// middleware.ts (in project root)
import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export const config = {
  matcher: ["/protected/:path*"], // ✅ only guard /protected/*
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return res;
}
