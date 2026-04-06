import { NextResponse } from "next/server";

export function middleware(request) {
  // Allow the password API route through
  if (request.nextUrl.pathname === "/api/password") {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals through
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon") ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("site-auth");
  if (authCookie?.value === "authenticated") {
    return NextResponse.next();
  }

  // Return the password page
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Productive Money — Password Required</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #fff;
    }
    .container {
      text-align: center;
      max-width: 360px;
      padding: 2rem;
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      letter-spacing: 0.02em;
    }
    p {
      font-size: 0.875rem;
      color: #888;
      margin-bottom: 2rem;
    }
    form { display: flex; flex-direction: column; gap: 0.75rem; }
    input {
      padding: 0.75rem 1rem;
      border: 1px solid #333;
      border-radius: 8px;
      background: #111;
      color: #fff;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus { border-color: #666; }
    button {
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 8px;
      background: #fff;
      color: #000;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.85; }
    .error {
      color: #f55;
      font-size: 0.8rem;
      min-height: 1.2em;
    }
  </style>
</head>
<body>
  <div class="container">
    <p>This site is not yet public. Enter the password to continue.</p>
    <form id="pw-form">
      <input type="password" id="pw" placeholder="Password" autocomplete="off" autofocus />
      <button type="submit">Enter</button>
      <div class="error" id="error"></div>
    </form>
  </div>
  <script>
    document.getElementById('pw-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = document.getElementById('pw').value;
      const res = await fetch('/api/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        document.getElementById('error').textContent = 'Incorrect password';
        document.getElementById('pw').value = '';
      }
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
