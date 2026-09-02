# 🚀 InterviewIQ: 100% Pulsuz (Free) Deploy Bələdçisi

Bu bələdçi ilə InterviewIQ layihəsini **heç bir ödəniş etmədən və kart məlumatı tələb olunmadan** 3 addımda qlobal internetə deploy edə bilərsiniz.

---

## 🏗️ Pulsuz Arxitektura Xəritəsi

```
┌─────────────────────────────────┐
│     FRONTEND: Vercel (Pulsuz)   │ ──► https://interviewiq.vercel.app
└────────────────┬────────────────┘
                 │ API Sorğuları
                 ▼
┌─────────────────────────────────┐
│     BACKEND: Render (Pulsuz)    │ ──► https://interviewiq-api.onrender.com
└───────┬─────────────────┬───────┘
        │                 │
        ▼                 ▼
┌──────────────┐   ┌───────────────────────────┐
│ MONGODB      │   │ AI MÜHƏRRİKİ:             │
│ Atlas (M0)   │   │ - Google Gemini (Bulud)   │
│ 100% Pulsuz  │   │ VƏ YA                     │
│              │   │ - RTX 3050 GPU (Lokal     │
│              │   │   Cloudflare Tunnel ilə)  │
└──────────────┘   └───────────────────────────┘
```

---

## 1-ci Addım: Pulsuz Verilənlər Bazası (MongoDB Atlas M0)

1. [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) saytına daxil olun və pulsuz qeydiyyatdan keçin.
2. **Create a Deployment** seçin:
   - **M0 (Free)** planını seçin ($0/month).
   - Region: Frankfurt (və ya sizə ən yaxın olan pulsuz region).
3. **Security Quickstart**:
   - **Database User**: İstifadəçi adı və şifrə təyin edin (məsələn: `admin` və `GucluSifre2026`).
   - **Network Access**: `0.0.0.0/0` (Allow Access from Anywhere) əlavə edin.
4. **Connect** düyməsini sıxın ➔ **Drivers (Node.js)** seçin və connection string-i kopyalayın:
   ```text
   mongodb+srv://admin:GucluSifre2026@cluster0.abcde.mongodb.net/interviewiq?retryWrites=true&w=majority
   ```

---

## 2-ci Addım: Backend Serverin Deploy Edilməsi (Render.com)

1. [render.com](https://render.com) saytına daxil olun (GitHub ilə daxil olun).
2. **New +** ➔ **Web Service** seçin.
3. GitHub-dakı layihə repository-nizi bağlayın.
4. Konfiqurasiya parametrləri:
   - **Name**: `interviewiq-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. **Environment Variables** (Ətraf Mühit Dəyişənləri) bölməsinə aşağıdakıları əlavə edin:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `MONGO_URI` = `mongodb+srv://admin:GucluSifre2026@cluster0.abcde.mongodb.net/interviewiq?retryWrites=true&w=majority`
   - `JWT_SECRET` = `super_secret_interviewiq_jwt_token_key_2026`
   - `GEMINI_API_KEY` = `your_gemini_api_key_here`
   - `GEMINI_MODEL` = `gemini-3.5-flash-lite`
   - `AI_PROVIDER` = `gemini` *(Qeyd: Əgər evdəki RTX 3050-ni qoşmaq istəyirsinizsə, aşağıdakı Hibrid bölməsinə baxın)*
   - `CLIENT_URL` = `https://interviewiq.vercel.app` *(3-cü addımdakı Vercel URL-iniz)*
6. **Create Web Service** düyməsini sıxın. 2-3 dəqiqəyə backend hazır olacaq və sizə bir link verəcək:
   `https://interviewiq-api.onrender.com`

---

## 3-cü Addım: Frontend İnterfeysin Deploy Edilməsi (Vercel)

1. [vercel.com](https://vercel.com) saytına daxil olun (GitHub ilə).
2. **Add New...** ➔ **Project** seçin və repository-nizi seçin.
3. Layihə parametrləri:
   - **Root Directory**: `client` seçin (Edit ➔ `client`).
   - **Framework Preset**: `Vite` (avtomatik tanıyır).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - `VITE_API_URL` = `https://interviewiq-api.onrender.com/api/v1` *(Render-də aldığınız linkin sonuna `/api/v1` əlavə edin)*
5. **Deploy** düyməsini sıxın!
   - 1 dəqiqə ərzində saytınız qlobal olaraq aktiv olacaq (məs: `https://interviewiq.vercel.app`).
   - `client/vercel.json` və `client/public/_redirects` faylları artıq layihəyə əlavə edildiyi üçün bütün daxili səhifələr (`/dashboard/cs-automation`, `/login` və s.) yeniləndikdə belə problemsiz işləyəcək.

---

## 🌟 Əlavə: Evdəki RTX 3050 GPU-nu Pulsuz İnternetə Qoşmaq (Hibrid Rejim)

Əgər istəyirsinizsə ki, internetdəki canlı saytınız Google API əvəzinə sizin kompüterinizdəki **RTX 3050 GPU-da işləyən Qwen 2.5 Coder** modelindən istifadə etsin:

1. Kompüterinizdə pulsuz **Cloudflare Tunnel** işə salın:
   ```powershell
   winget install Cloudflare.cloudflared
   cloudflared tunnel --url http://127.0.0.1:11434
   ```
2. Cloudflare sizə pulsuz təhlükəsiz HTTPS linki verəcək:
   `https://random-words.trycloudflare.com`
3. Render-dəki Environment Variables bölməsində:
   - `AI_PROVIDER` = `local_llm`
   - `OLLAMA_BASE_URL` = `https://random-words.trycloudflare.com`
4. Kompüteriniz açıq olanda canlı saytınız sizin GPU-nuzla işləyəcək, kompüteri söndürdükdə isə bizim qurduğumuz failover sistemi sayəsində avtomatik Gemini Cloud-a keçəcək!

---

Təbriklər! Layihəniz artıq 100% pulsuz olaraq internetdə hər kəs üçün əlçatandır!
