# دليل الإعداد: ديلول تشس

كل الخطوات هنا تُنفَّذ من متصفح الهاتف، إلا ما عليه علامة 🖥️.
أسماء الأزرار في لوحات Supabase وVercel وGitHub قد تتغيّر قليلًا مع الوقت. إن لم تجد زرًا باسمه بالضبط، فابحث عن أقرب اسم له.

| # | الخطوة | الحالة |
|---|---|---|
| 1 | ربط Vercel | ✅ منتهية |
| 2 | إنشاء مشروعَي Supabase | ⬜ |
| 3 | مفاتيح Supabase في Vercel | ⬜ |
| 4 | رابط قاعدة البيانات في GitHub Secrets | ⬜ |
| 5 | تطبيق الـ migrations | ⬜ |
| 6 | روابط تسجيل الدخول في Supabase | ⬜ |
| 7 | جعل حسابك مسؤولًا (admin) | ⬜ |
| 8 | حماية فرع `main` | ⬜ (عند أول Pull Request) |
| 9 | 🖥️ تسجيل الدخول بـ Google | مؤجّلة |
| 10 | البريد (Resend) وSentry | مؤجّلة إلى آخر المرحلة 0 |

---

## 1. Vercel ✅
- المشروع `diloul-chess` مربوط بالمستودع، و`vercel.json` يفرض إعداد Next.js.
- كل فرع يحصل على رابط معاينة. والرابط الرئيسي `diloul-chess.vercel.app` يُبنى من `main`.

## 2. إنشاء مشروعَي Supabase
نحتاج مشروعين (الخطة المجانية تسمح باثنين): واحد للتجربة وواحد للموقع الحقيقي.

1. افتح https://supabase.com وسجّل الدخول، ويُستحسن بحساب GitHub.
2. اضغط **New project**:
   - **Name:** `diloul-dev`
   - **Database Password:** اضغط **Generate**، ثم **انسخها واحفظها** في مكان آمن (مدير كلمات المرور). ستحتاجها في الخطوة 4.
   - **Region:** اختر الأقرب لموريتانيا، مثل **West EU (Paris)** أو **West EU (Ireland)**.
3. انتظر دقيقتين حتى يجهز المشروع.
4. كرّر الخطوات نفسها لمشروع ثانٍ باسم `diloul-prod`، بكلمة مرور مختلفة.

## 3. مفاتيح Supabase في Vercel
هذه المفاتيح عامة بطبيعتها، فهي تصل إلى المتصفح، والحماية الحقيقية في قاعدة البيانات (RLS). لا تضع أبدًا المفتاح السري (`secret` أو `service_role`) في Vercel.

1. في Supabase افتح مشروع **diloul-dev**، ثم **Project Settings**.
2. انسخ **Project URL** من **Data API**.
3. انسخ **Publishable key** (يبدأ بـ `sb_publishable_`) من **API Keys**.
4. في Vercel افتح المشروع، ثم **Settings**، ثم **Environment Variables**، وأضف:

   | الاسم | القيمة | البيئة |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | رابط **diloul-dev** | **Preview** فقط |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | مفتاح **diloul-dev** | **Preview** فقط |
   | `NEXT_PUBLIC_SUPABASE_URL` | رابط **diloul-prod** | **Production** فقط |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | مفتاح **diloul-prod** | **Production** فقط |

5. افتح **Deployments**، واضغط ⋯ بجانب آخر نشر للفرع، ثم **Redeploy**، لأن المتغيّرات لا تُطبَّق على نشر قديم.

## 4. رابط قاعدة البيانات في GitHub Secrets
يستعمله الـ workflow الذي ينشئ الجداول. هذا الرابط **سري**، لأنه يحوي كلمة مرور القاعدة.

1. في Supabase، مشروع **diloul-dev**، اضغط **Connect** في أعلى الصفحة.
2. اختر **Session pooler** (وليس Direct connection، لأن الاتصال المباشر لا يعمل من GitHub).
3. انسخ الرابط، وهو يشبه:
   `postgresql://postgres.abcd...:[YOUR-PASSWORD]@aws-0-eu-west-3.pooler.supabase.com:5432/postgres`
4. ضع كلمة المرور من الخطوة 2 مكان `[YOUR-PASSWORD]`، واحذف القوسين.
5. في GitHub افتح المستودع، ثم **Settings**، ثم **Secrets and variables**، ثم **Actions**، ثم **New repository secret**:
   - **Name:** `SUPABASE_DB_URL_DEV`
   - **Secret:** الرابط كاملًا
6. كرّر الخطوات لمشروع **diloul-prod** باسم `SUPABASE_DB_URL_PROD`.

> 💡 صفحة الإعدادات في تطبيق GitHub على الهاتف محدودة. إن لم تجد **Secrets**، فافتح github.com في متصفح الهاتف.

## 5. تطبيق الـ migrations (إنشاء الجداول)
1. في GitHub افتح المستودع، ثم **Actions**، ثم **Database migrations**، ثم **Run workflow**.
2. اختر الفرع `claude/spec-review-phase-0-h7cih3`، و**target: dev**.
3. يمكنك أولًا تفعيل **dry_run** لترى ما سيُطبَّق دون تغيير شيء.
4. اضغط **Run workflow** وانتظر العلامة الخضراء ✅.
5. للتحقق: في Supabase افتح **Table Editor**، وستجد 7 جداول: `profiles`، و`linked_accounts`، و`area_ranks`، و`course_progress`، و`srs_cards`، و`puzzle_stats`، و`daily_activity`.
6. طبّق على **prod** لاحقًا، عند دمج المرحلة 0 في `main`.

## 6. روابط تسجيل الدخول في Supabase
بدون هذه الخطوة يرفض Supabase إعادتك إلى الموقع بعد الضغط على رابط البريد.

1. في Supabase، مشروع **diloul-dev**، افتح **Authentication**، ثم **URL Configuration**.
2. **Site URL:** `https://diloul-chess.vercel.app`
3. **Redirect URLs:** أضف هذه الثلاثة:
   - `https://*-sidi-moctar.vercel.app/**` (كل روابط المعاينة)
   - `https://diloul-chess.vercel.app/**`
   - `http://localhost:3000/**`
4. **اختياري (موصى به):** في **Authentication**، ثم **Emails**، ثم **Magic Link**، أضف هذا السطر إلى نص الرسالة:
   `رمزك: {{ .Token }}`
   هكذا يستطيع اللاعب كتابة الرمز إن فتح الرابط في متصفح آخر.
5. كرّر الخطوات لمشروع **diloul-prod**.

> ⚠️ **حدّ البريد:** بريد Supabase الافتراضي لا يرسل إلا إلى أعضاء فريق المشروع (أنت)، وبعدد محدود جدًا في الساعة.
> لذلك يكفي لتجربتك أنت فقط. وحتى يسجّل أصدقاؤك، نحتاج **Resend** (الخطوة 10) أو تسجيل الدخول بـ **Google** (الخطوة 9).

## 7. جعل حسابك مسؤولًا (admin)
1. سجّل الدخول مرة واحدة في الموقع (رابط المعاينة، ثم الملف الشخصي، ثم «سجّل الدخول»)، حتى يُنشأ ملفك.
2. في Supabase افتح **SQL Editor**، ثم **New query**، والصق هذا السطر مع بريدك:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'بريدك@example.com');
   ```
3. اضغط **Run**.
4. في الموقع، يظهر لك زر «لوحة التحكم» في الملف الشخصي، والرابط `/ar/admin`.

هذا تعديل بيانات لا تعديل جداول، فلا يحتاج migration. ولا يستطيع أي لاعب أن يغيّر دوره بنفسه، فقاعدة البيانات تمنع ذلك.

## 8. حماية فرع `main` (عند أول Pull Request)
1. في GitHub افتح المستودع، ثم **Settings**، ثم **Branches** (أو **Rules**، ثم **Rulesets**).
2. أضف قاعدة لـ `main`:
   - **Require a pull request before merging**
   - **Require status checks to pass**، بعد إضافة CI في الخطوة 6 من المرحلة 0.
   - **Block force pushes**

## 9. 🖥️ تسجيل الدخول بـ Google (مؤجّلة)
> 🖥️ **يُفضَّل الحاسوب:** إعداد OAuth في Google Cloud Console
> **السبب:** الواجهة كثيفة وفيها عدة شاشات متتالية.
> **البديل على الهاتف:** صعب، لكنه ممكن بوضع «سطح المكتب» في المتصفح.
> **الوقت المتوقع على الحاسوب:** 15–20 دقيقة

ستُكتب الخطوات التفصيلية عند الوصول إليها. وفي النهاية يُضاف في Vercel المتغيّر `NEXT_PUBLIC_AUTH_GOOGLE=on`، فيظهر الزر في صفحة الدخول.

## 10. البريد (Resend) وSentry (مؤجّلان)
حسب طلبك، تأتيان في آخر المرحلة 0 أو عند الحاجة.

---

## ملفات مهمة
- `supabase/migrations/`: كل تغيير في قاعدة البيانات، ولا يُعدَّل شيء يدويًا من اللوحة.
- `supabase/tests/rls_test.sql`: يتحقق أن كل لاعب لا يرى إلا بياناته. سيعمل في CI.
- `.env.example`: أسماء المتغيّرات.
