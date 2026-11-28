# دليل الإعداد: ديلول تشس

كل الخطوات هنا تُنفَّذ من متصفح الهاتف، إلا ما عليه علامة 🖥️.
أسماء الأزرار في لوحات Supabase وVercel وGitHub قد تتغيّر قليلًا مع الوقت. إن لم تجد زرًا باسمه بالضبط، فابحث عن أقرب اسم له.

| # | الخطوة | الحالة |
|---|---|---|
| 1 | ربط Vercel | ✅ منتهية |
| 2 | إنشاء مشروعَي Supabase | 🟡 `diloul-dev` ✅ (eu-west-1)، و`diloul-prod` ⬜ (قبل الدمج في `main`) |
| 3 | مفاتيح Supabase في Vercel | 🟡 Preview (dev) ✅، وProduction (prod) ⬜ |
| 4 | رابط قاعدة البيانات في GitHub Secrets | 🟡 `DEV` ✅، و`PROD` ⬜ |
| 5 | تطبيق الـ migrations | 🟡 dev ✅ (7 جداول)، وprod ⬜ |
| 6 | روابط تسجيل الدخول في Supabase | 🟡 dev ✅، وprod ⬜ |
| 7 | جعل حسابك مسؤولًا (admin) | 🟡 dev ✅ (`/admin` تعمل)، وprod ⬜ |
| 8 | حماية فرع `main` | ✅ |
| 9 | 🖥️ تسجيل الدخول بـ Google | مؤجّلة |
| 10 | البريد (Resend) وSentry | مؤجّلة إلى آخر المرحلة 0 |
| 11 | CI على GitHub Actions | ✅ تعمل تلقائيًا |
| 12 | تثبيت التطبيق على الهاتف (PWA) | ✅ جرّبه |
| 13 | رمز Lichess | ⬜ (قبل المرحلة 1) |
| 14 | نطاق خاص (اختياري) | ⬜ |

---

## 1. Vercel ✅
- المشروع `diloul-chess` مربوط بالمستودع. و`vercel.json` يفرض إعداد Next.js، ويحدد المنطقة `dub1` (دبلن)، وهي بجانب قاعدة Supabase في `eu-west-1` (أيرلندا).
- كل فرع يحصل على رابط معاينة. والرابط الرئيسي `diloul-chess.vercel.app` يُبنى من `main`.

## 2. إنشاء مشروعَي Supabase
نحتاج مشروعين (الخطة المجانية تسمح باثنين): واحد للتجربة وواحد للموقع الحقيقي.

1. افتح https://supabase.com وسجّل الدخول، ويُستحسن بحساب GitHub.
2. اضغط **New project**:
   - **Name:** `diloul-dev`
   - **Database Password:** اضغط **Generate**، ثم **انسخها واحفظها** في مكان آمن (مدير كلمات المرور). ستحتاجها في الخطوة 4.
   - **Region:** اختر الأقرب لموريتانيا، مثل **West EU (Ireland)** (`eu-west-1`) أو **West EU (Paris)**. اختر المنطقة نفسها للمشروعين.
   - **Grant API access to new tables automatically:** اتركه **غير مفعّل** (موصى به). الـ migrations تمنح الصلاحيات صراحةً لكل جدول، فلا يُفتح جدول جديد للعموم بالخطأ.
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
1. في GitHub افتح المستودع، ثم **Actions**، ثم **Database migrations**، ثم **Run workflow**. (الملف موجود في `main` منذ دمج PR #1، وهذا شرط GitHub لظهور الزر.)
2. في **Use workflow from** اختر الفرع الذي فيه الـ migrations، وهو حاليًا `claude/spec-review-phase-0-h7cih3`، ثم بعد دمج المرحلة 0: `main`. واختر **target: dev**.
3. يمكنك أولًا تفعيل **dry_run** لترى ما سيُطبَّق دون تغيير شيء.
4. اضغط **Run workflow** وانتظر العلامة الخضراء ✅.
5. للتحقق: في Supabase افتح **Table Editor**، وستجد 7 جداول: `profiles`، و`linked_accounts`، و`area_ranks`، و`course_progress`، و`srs_cards`، و`puzzle_stats`، و`daily_activity`. وعلى كل جدول شارة **RLS enabled**.
6. **للتحقق من الصلاحيات** (اختياري): افتح **SQL Editor**، والصق هذا الاستعلام، ثم **Run**:
   ```sql
   select grantee, table_name, string_agg(privilege_type, ',') as privs
   from information_schema.role_table_grants
   where table_schema = 'public' and grantee in ('anon', 'authenticated', 'service_role')
   group by 1, 2 order by 2, 1;
   ```
   النتيجة الصحيحة:
   - `authenticated` له `SELECT,UPDATE` على `profiles`، و`SELECT,INSERT,UPDATE,DELETE` على بقية الجداول.
   - `service_role` له الصلاحيات الأربع على كل الجداول.
   - **`anon` لا يظهر أبدًا**، لأن الضيف لا يلمس قاعدة البيانات.
7. طبّق على **prod** لاحقًا، عند دمج المرحلة 0 في `main`.

> **لماذا الصلاحيات صريحة؟** مع إطفاء «Grant API access to new tables automatically» لا يمنح Supabase أي صلاحية تلقائيًا. لذلك:
> - الملف `supabase/migrations/20261128000000_explicit_grants.sql` يمنح ما يلزم صراحةً: استعمال الـ schema، وجداول اللاعب لـ `authenticated`، وكل الجداول لـ `service_role` (سكربتات الإدارة فقط)، ولا شيء لـ `anon`.
> - تبقى RLS مفعّلة على كل جدول: الصلاحية تحدد مَن يصل إلى الجدول أصلًا، وRLS تحدد أي صفوف يرى.
> - اختبار CI يفشل إن وُجد جدول بلا RLS، أو إن استطاع `anon` قراءة شيء.
> - إن كنت شغّلت الـ migrations قبل إضافة هذا الملف، فشغّل الـ workflow مرة أخرى، وسيطبّق الملف الجديد وحده.

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

**Resend (بريد الدخول للأصدقاء):**
1. افتح resend.com وأنشئ حسابًا مجانيًا.
2. أنشئ **API Key**.
3. في Supabase افتح **Authentication**، ثم **Emails**، ثم **SMTP Settings**، ثم **Enable custom SMTP**:
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **User:** `resend`
   - **Password:** المفتاح
4. إرسال البريد من عنوان باسمك يحتاج نطاقًا خاصًا (الخطوة 14). وبدونه، تتيح Resend الإرسال من عنوان تجريبي بحدود صغيرة.
5. ترجمة رسائل الدخول إلى العربية والفرنسية ستُكتب لك عند التفعيل.

**Sentry (التقاط الأخطاء):**
- المكان جاهز في الكود: `src/lib/monitoring/report.ts`، وصفحات الخطأ تستدعيه. لكنه غير مفعّل، فالأخطاء تذهب إلى console فقط.
- **عند التفعيل:**
  1. أنشئ مشروع Next.js في sentry.io (الخطة المجانية).
  2. انسخ الـ **DSN**، وضعه في Vercel باسم `NEXT_PUBLIC_SENTRY_DSN`.
  3. أخبرني، فأثبّت الحزمة وأربطها مع إخفاء البيانات الشخصية.

## 11. CI على GitHub Actions ✅
يعمل تلقائيًا مع كل دفعة (push) وكل Pull Request، ولا يحتاج أي مفتاح:
- **Types, lint, unit tests, content, build:** فحص الأنواع، وESLint، واختبارات Vitest، والتحقق من المحتوى، والبناء دون مفاتيح Supabase.
- **Migrations + RLS tests:** ينشئ قاعدة Postgres مؤقتة، ويطبّق كل الـ migrations، ويتحقق أن كل لاعب لا يرى إلا بياناته.
- **Playwright (phone 360px):** اختبارات الواجهة على شاشة هاتف. تعمل على `main` وعلى كل Pull Request، ويمكن تشغيلها يدويًا (**Actions**، ثم **CI**، ثم **Run workflow**).

لرؤية النتيجة: افتح المستودع، ثم **Actions**. ✅ أخضر يعني أن كل شيء سليم. وإن فشل شيء ❌، فأرسل لي اسم الخطوة.

## 12. تثبيت التطبيق على الهاتف (PWA) ✅
- **Android (Chrome):** افتح الموقع، ثم ⋮، ثم **تثبيت التطبيق** (أو **إضافة إلى الشاشة الرئيسية**).
- **iPhone (Safari):** زر المشاركة، ثم **إضافة إلى الشاشة الرئيسية**.

الصفحات التي فتحتها مرة تعمل دون اتصال. أما الصفحات الجديدة فتعرض رسالة «لا يوجد اتصال».

> روابط المعاينة محمية بتسجيل الدخول في Vercel، والتثبيت منها قد لا يعمل. التثبيت الحقيقي يكون من الرابط الرئيسي بعد الدمج في `main`.

## 13. رمز Lichess (قبل المرحلة 1)
يستعمله سكربت بناء الافتتاحات فقط، لأن مستكشف Lichess يتطلب الآن رمزًا. ولا يُستعمل داخل الموقع أبدًا.

1. على lichess.org افتح **Preferences**، ثم **API access tokens**، ثم **+**.
2. اكتب وصفًا مثل `diloul build-openings`، **ولا تختر أي صلاحية**، فالقراءة العامة تكفي. ثم **Create**.
3. انسخ الرمز (يظهر مرة واحدة)، وضعه في GitHub Secrets باسم `LICHESS_TOKEN`، بالطريقة نفسها في الخطوة 4.

## 14. نطاق خاص (اختياري)
- مثل `diloul.com` أو `diloul.app` (حوالي 10–15 دولارًا في السنة)، وهي التكلفة الوحيدة المحتملة في المشروع.
- بعد الشراء: في Vercel افتح **Settings**، ثم **Domains**، ثم **Add**، واتبع التعليمات (سجلات DNS عند بائع النطاق).
- ثم أضف النطاق الجديد في روابط Supabase (الخطوة 6).

---

## ملفات مهمة
- `supabase/migrations/`: كل تغيير في قاعدة البيانات، ولا يُعدَّل شيء يدويًا من اللوحة.
- `supabase/tests/rls_test.sql`: يتحقق أن كل لاعب لا يرى إلا بياناته، ويعمل في CI.
- `.github/workflows/ci.yml`: الفحوص التلقائية.
- `.github/workflows/db-migrate.yml`: تطبيق الـ migrations يدويًا.
- `.env.example`: أسماء المتغيّرات.
