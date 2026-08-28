import { createServerClient, parseCookieHeader } from "@supabase/ssr";

export const getSupabaseServer = (context) => {
  return createServerClient(
    // Crea una instancia de cliente de supabase

    // Conseguimos las credenciales
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,

    {
      cookies: {
        getAll() {
          // Lee las cookies que llegan del login
          return parseCookieHeader(context.request.headers.get("Cookie") ?? "");
        },

        setAll(cookiesToset) {
          // Escribe/actualiza las cookies en la respuesta del servidor
          cookiesToset.forEach(({ name, value, options }) => {
            context.cookies.set(name, value, options);
          });
        },
        cookieOptions: {
          maxAge: 60 * 60 * 24 * 7, // 7 días
          path: "/",
          sameSite: "lax",
          secure: true,
        },
      },
    },
  );
};
