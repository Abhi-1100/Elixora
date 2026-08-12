# Next.js Auth Pages — Integration Guide

## 1. Where these files go in your existing Next.js project
Copy each file into the matching path in your project (create folders if they don't exist):
```
your-nextjs-project/
├── lib/api.js
├── context/AuthContext.jsx
├── app/
│   ├── login/page.jsx
│   ├── signup/page.jsx
│   └── dashboard/page.jsx
```

## 2. Wrap your app with AuthProvider
Open `app/layout.jsx` (your root layout) and wrap the children with the provider:

```jsx
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

## 3. Set your backend URL
Create/edit `.env.local` in your Next.js project root:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 4. Make sure Tailwind is set up
These pages use plain Tailwind utility classes with the color palette from our design system
(`#0B3D3A` teal, `#E8F3F1` mint, `#D97A4D` clay-orange for errors). No extra Tailwind config
changes needed — the hex values are used directly via arbitrary value syntax (e.g. `bg-[#0B3D3A]`).

## 5. Run both servers together
Terminal 1 (backend):
```
cd backend
python run.py
```
Terminal 2 (frontend):
```
cd your-nextjs-project
npm run dev
```

## 6. Test the flow
1. Go to `http://localhost:3000/signup`
2. Fill the form, submit — you should land on `/dashboard` showing your name
3. Click "Log out", then go to `/login` and log back in with the same credentials
4. Try visiting `/dashboard` directly while logged out — it should redirect you to `/login`

## 7. Reusing this pattern for other modules
For any future protected page (chat, report upload, medicine scan), copy the pattern in
`dashboard/page.jsx`:
```jsx
const { user, loading } = useAuth();
useEffect(() => {
  if (!loading && !user) router.push("/login");
}, [loading, user]);
```

And when calling your backend from those pages, pass the token:
```js
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const { token } = useAuth();
const data = await apiRequest("/reports/upload", { method: "POST", body: formData, token });
```

## Note on token storage
This uses `localStorage` for simplicity, which is fine for a student project demo.
If you want to mention security best-practices in your report: production apps typically
use httpOnly cookies instead, since localStorage is readable by any JS on the page
(XSS risk). Worth a one-line mention in your "limitations/future work" section.
