# Vercel Deployment Bələdçisi (InterviewIQ AI)

Bu layihə Vercel platformasında həm **Monorepo (Bütün layihə bir yerdə)**, həm də **Ayrı-Ayrı (Frontend və Backend ayrı layihə kimi)** yerləşdirilməsi üçün tam konfiqurasiya olunub.

---

## 🚀 Üsul 1: Bütün Layihəni Tək Vercel Layihəsi Kimi Yerləşdirmək (Tövsiyə olunur)

1. [Vercel Dashboard](https://vercel.com/dashboard) səhifəsinə daxil olun.
2. **Add New...** -> **Project** seçin.
3. GitHub-dakı `InterviewIQ-AI` repositoriyanızı seçin (**Import**).
4. **Root Directory**: `.` (Varsayılan olaraq saxlayın).
5. **Environment Variables** bölməsinə aşağıdakı dəyişənləri əlavə edin:

| Dəyişən Adı (Key) | Nümunə Dəyər (Value) | Açıqlama |
|-------------------|----------------------|----------|
| `NODE_ENV` | `production` | İstehsalat mühiti |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/interviewiq` | MongoDB Atlas bağlantı ünvanı |
| `JWT_SECRET` | `super_secret_jwt_key_here` | JWT şifrələmə açarı |
| `JWT_EXPIRES_IN` | `7d` | Sessiya müddəti |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API açarı (Sual generasiyası & AI qiymətləndirmə üçün) |
| `GEMINI_MODEL` | `gemini-2.5-flash` | İstifadə olunan Gemini modeli |
| `CLIENT_URL` | `https://sizin-layihe.vercel.app` | Vercel-də yaranan layihə ünvanınız |
| `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` | Google OAuth Client ID |
| `EMAILJS_SERVICE_ID` | `service_...` | EmailJS Service ID |
| `EMAILJS_TEMPLATE_ID` | `template_...` | EmailJS Template ID |
| `EMAILJS_RESET_TEMPLATE_ID` | `template_reset_...` | EmailJS Şifrə sıfırlama şablonu |
| `EMAILJS_PUBLIC_KEY` | `public_...` | EmailJS Public Key |
| `VITE_API_URL` | `/api/v1` | Frontend-in backend API ilə əlaqəsi |

6. **Deploy** düyməsini basın.

---

## 🛠️ Üsul 2: Frontend və Backend-i Ayrı-Ayrı Deploy Etmək

### Addım A: Backend (Server) Deploy-u
1. Vercel-də **New Project** yaradın.
2. **Root Directory**: `server` seçin.
3. **Environment Variables** bölməsinə `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, `EMAILJS_*` və `CLIENT_URL` (Frontend domeniniz) daxil edin.
4. **Deploy** düyməsini basın və yaranan Backend URL-ni kopyalayın (məs: `https://interviewiq-api.vercel.app`).

### Addım B: Frontend (Client) Deploy-u
1. Vercel-də **New Project** yaradın.
2. **Root Directory**: `client` seçin.
3. **Framework Preset**: `Vite`.
4. **Environment Variables** bölməsinə:
   - `VITE_API_URL`: `https://interviewiq-api.vercel.app/api/v1` (Backend ünvanınız).
5. **Deploy** düyməsini basın.

---

## 🔍 Yoxlama və Problem Həlli (Troubleshooting)

- **MongoDB Whitelist**: MongoDB Atlas panelində **Network Access** bölməsinə daxil olub `0.0.0.0/0` (Allow Access from Anywhere) ip ünvanının aktiv olduğundan əmin olun ki, Vercel Serverless funksiyaları bazaya qoşula bilsin.
- **Gemini API**: `GEMINI_API_KEY` düzgün qeyd olunubsa, CS Automation və AI Interview sualları və qiymətləndirmələri dərhal işə düşəcək.
- **SPA Yenilənmələri (404 Error)**: `vercel.json` faylı daxilində bütün səhifə marşrutları `/index.html`-ə yönləndirildiyi üçün səhifəni yenilədikdə (F5) heç bir 404 xətası yaranmayacaq.
