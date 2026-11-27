# CLAUDE.md: ذاكرة جلسات العمل على ديلول تشس

@AGENTS.md

المرجع الوحيد هو `SPEC.md`. يسجّل هذا الملف القرارات التقنية وأسبابها، لتعرفها الجلسات القادمة.

## الحالة الحالية
- **المرحلة 0، الخطوة 1:** صفحة اتجاهات التصميم `/dev/design` جاهزة. **ننتظر اختيار Yede.**
- خطة المرحلة 0 الموافَق عليها، بالترتيب:
  1. صفحة اتجاهات التصميم.
  2. تثبيت نظام التصميم.
  3. هيكل الترجمة والواجهة.
  4. المكوّنات وصفحة `/dev/components`.
  5. التخزين وSupabase وشاشة التصنيف الأولي.
  6. CI وPWA و`SETUP.md`.
- **أولوية Yede:** Vercel أولًا، ثم Supabase. أما Sentry وResend (البريد) فمؤجّلان إلى آخر المرحلة 0، أو إلى المرحلة التي نحتاجهما فيها فعلًا.
- **تذكير:** عند فتح أول Pull Request، ذكّر Yede بتفعيل حماية فرع `main`.

## القرارات التقنية
| القرار | السبب |
|---|---|
| Next.js 16.4.6 (App Router وTurbopack و`cacheComponents`)، وReact 19.3، وTypeScript 5 بوضع strict | آخر إصدار مستقر وقت الإنشاء. بقينا على TS 5.x لأن Next 16 يطلب 5.1 فأكثر، وTS 7 جديد. |
| Tailwind CSS 4 عبر `@tailwindcss/turbopack` | من قالب `create-next-app@16.4.6`. |
| `chessground@9.2.1` و`chess.js@1.4.0` و`lucide-react@1.82.0` | آخر الإصدارات وقت التثبيت. |
| `<StaticBoard>` في `src/components/board`: رقعة ثابتة من FEN بلا JavaScript، بقطع cburnett من Chessground | للبطاقات والنماذج. سيصبح أساس `<MiniBoard>`. |
| صفحة `/dev/design` بلا JavaScript في المتصفح: تبديل الاتجاه والوضع واللغة بـ CSS فقط (radio و`:has`) | حتى تُصدَّر كملف HTML واحد (`scripts/export-static-page.mjs`) ويُشارك رابط معاينة قبل ربط Vercel. |
| صفحة `/dev/design` تحمّل الخطوط من Google Fonts برابط `<link>` | صفحة داخلية تقارن 7 خطوط. أما الموقع فسيستعمل `next/font` بعد اختيار الخط. |
| نصوص `/dev/design` في `directions.ts`، لا في ملفات الترجمة | صفحة داخلية مؤقتة تُحذف بعد الاختيار. كل نصوص الموقع تمر عبر `next-intl` بدءًا من الخطوة 3. |
| كل موقف شطرنجي معروض يُتحقق منه بـ chess.js قبل استعماله | القسم 15.1 من المواصفات. |

## مهام الحاسوب (🖥️ مؤجّلة)
- [ ] إعداد تسجيل الدخول بـ Google في Google Cloud Console (الخطوة 5). لا يعطّل شيئًا: الدخول بالرابط السحري يعمل بدونه.

## أوامر مفيدة
- `npm run dev` / `npm run build` / `npm run lint`
- تصدير صفحة ثابتة: `npx next start -p 3123` ثم `node scripts/export-static-page.mjs http://localhost:3123/dev/design out.html "العنوان"`
