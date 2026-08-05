# 03 — Tasks (المهام الذرية القابلة للتنفيذ)

> كل مهمة: **ملف واحد أو مجموعة ملفات مترابطة صغيرة فقط**. لا تدمج مهمتين في طلب واحد للنموذج الرخيص. استخدم القالب المطابق من مجلد `tasks/`.

**رمز الحالة**: ⬜ لم تبدأ | 🟨 قيد التنفيذ | ✅ منجزة

---

## Phase 0 — الأساس (Foundation) — يجب إنجازه أولًا بالكامل

| ID | المهمة | الملفات | التبعيات | معايير القبول |
|---|---|---|---|---|
| T001 | إنشاء هيكل المجلدات الفارغ + `index.html` هيكلي (شريط جانبي فارغ، header) | كل بنية §1 من `02-plan.md` | لا شيء | فتح `index.html` في المتصفح لا يعطي 404 لأي ملف مربوط |
| T002 | `css/base.css` بالمتغيرات المحددة في `02-plan.md §9` + reset أساسي | css/base.css | T001 | المتغيرات تظهر عبر DevTools |
| T003 | `js/data/constants.js` (SOURCES, STAGES, RATINGS, AGENTS تجريبية ≥5) | js/data/constants.js | T001 | `console.log` يطبع القوائم بدون أخطاء |
| T004 | `js/data/db.js`: فتح IndexedDB بالـ schema الكامل من `02-plan.md §3` | js/data/db.js | T001 | فحص `DevTools > Application > IndexedDB` يُظهر 5 stores بالفهارس الصحيحة |
| T005 | `js/data/store.js`: تنفيذ كل التوقيعات السبعة في `02-plan.md §5` بما فيها إطلاق الأحداث المخصصة | js/data/store.js | T004 | استدعاء `add('leads', {...})` من console يُخزّن السجل فعليًا ويُطلق `crm:leads:updated` |
| T006 | `js/utils/id-generator.js` | js/utils/id-generator.js | T003 | استدعاءان متتاليان يعيدان `LD-000001` ثم `LD-000002` |
| T007 | `js/utils/validate.js` بكل قواعد §4 من `02-plan.md` | js/utils/validate.js | T003 | اختبار يدوي: بريد خاطئ يُرجع false، هاتف صحيح يُرجع true |
| T008 | `js/utils/format.js` (تنسيق تاريخ، عملة، أرقام) | js/utils/format.js | T001 | `formatDate('2026-07-18')` يعيد صيغة مقروءة |
| T009 | `js/components/toast.js` — REQ-901 | js/components/toast.js, css/components.css | T002 | استدعاء `showToast('ok','success')` يعرض Toast يختفي بعد 3 ثوانٍ |
| T010 | `js/components/modal.js` (نافذة تأكيد عامة قابلة لإعادة الاستخدام) | js/components/modal.js | T002 | فتح/إغلاق Modal يعمل بالـ ESC والزر |
| T011 | `js/data/seed.js`: توليد ≥30 Lead تجريبي متنوعة rating/stage عند أول تشغيل | js/data/seed.js | T005, T006 | أول فتح للتطبيق يملأ `leads` store بـ 30 سجلًا |

---

## Phase 1 — MVP (P0) — Leads الأساسية

| ID | المهمة | REQ | الملفات | التبعيات | معايير القبول |
|---|---|---|---|---|---|
| T101 | Layout الشريط الجانبي + التنقل بين كل الصفحات (روابط `<a>` حقيقية) | REQ-901(جزئي) | css/layout.css, كل .html | T001-T010 | كل رابط في القائمة الجانبية ينقل لصفحة موجودة فعليًا |
| T102 | `js/pages/dashboard.js`: 3 بطاقات Hot/Warm/Cold بأعداد حقيقية من `store.getAll('leads')` | REQ-101 | index.html, js/pages/dashboard.js, css/pages/dashboard.css | T005, T101 | تغيير rating لعميل واحد يُحدّث الأعداد بعد إعادة تحميل، وفوريًا عبر REQ-104 (T110) |
| T103 | نقر البطاقة → الانتقال لـ `/leads?rating=Hot` مع تفعيل الفلتر فعليًا | REQ-103 | js/pages/dashboard.js, js/pages/leads.js | T102, T105 | فتح leads.html?rating=Hot يعرض فقط Hot leads |
| T104 | `js/components/data-table.js`: جدول عام (رأس، صفوف، فرز بالنقر على العمود، تحديد صف عبر checkbox) | REQ-401 | js/components/data-table.js | T005 | جدول تجريبي بـ 30 صف يفرز عند نقر أي عمود |
| T105 | صفحة `leads.html` + `js/pages/leads.js`: عرض كل Leads عبر data-table | REQ-201(عرض) | leads.html, js/pages/leads.js | T104 | الصفحة تعرض 30 سجلًا من seed |
| T106 | `js/components/date-range.js`: مكوّن نطاق التاريخ (توجل single/range) | REQ-202 | js/components/date-range.js | T002 | التبديل بين الوضعين يغيّر عدد حقول الإدخال المعروضة |
| T107 | صفحة `lead-add.html` + `js/pages/lead-add.js`: نموذج إضافة كامل بكل الحقول، بدون اختيار مسبق تلقائي | REQ-201, REQ-204(B5) | lead-add.html, js/pages/lead-add.js | T003, T006, T007, T106 | حفظ ينشئ Lead جديد بـ id متسلسل صحيح؛ كل الحقول تبدأ فارغة عند فتح النموذج |
| T108 | `js/components/filter-bar.js` أساسي: بحث نصي + فلاتر stage/rating/source/assignedTo، **وربط زر "تطبيق" فعليًا بدالة تُحدّث الجدول** + **ترجمة الفلاتر المطبَّقة إلى Filter Chips** (REQ-306) | REQ-301, REQ-302, REQ-304(B4), REQ-306 | js/components/filter-bar.js | T104, T105 | تغيير أي فلتر ثم "تطبيق" يُقلّص/يوسّع صفوف الجدول فعليًا؛ اختبار: فلترة rating=Cold يجب ألا تُظهر أي صف Hot/Warm + كل فلتر مطبَّق يظهر كـ Chip `المفتاح: القيمة ✕` قابل للإزالة الفردية، و"Clear all" يمسح الكل، وعداد زر Filter يعرض عدد الفلاتر النشطة |
| T109 | شريط الإجراءات الجماعية: أيقونات (Assign, Tags, More, Edit, Settings, Add, Grid view) **ظاهرة دائمًا** في شريط الأدوات أعلى الجدول معطّلة `disabled` حتى تحديد ≥1 صف + تنفيذ 3 عمليات فعلية الآن: Reassign, Change Stage, Bulk Delete (مع تأكيد ثانٍ) | REQ-401, REQ-402(جزئي), REQ-403(B3), REQ-404 | js/pages/leads.js | T104, T005, T010 | قبل التحديد: الأيقونات مرئية لكن disabled؛ بعد تحديد 3 صفوف → Change Stage → القيمة الجديدة تظهر في الجدول فورًا لكل الثلاثة بدون إعادة تحميل |
| T110 | ربط حدث `crm:leads:updated` بتحديث Dashboard تلقائيًا (بدون تنقل بين الصفحات إن كانت في نفس التبويب عبر BroadcastChannel، أو عند العودة للصفحة) | REQ-104 | js/pages/dashboard.js | T102, T109 | تعديل rating من leads.html ثم العودة لـ index.html يعرض الرقم المحدث فورًا |
| T111 | Lead Code ظاهر كعمود أول في الجدول وفي تفاصيل الـ Drawer | REQ-203(B14) | js/pages/leads.js, js/components/lead-drawer.js | T105, T112 | كل صف يعرض LD-000xxx فريدًا |
| T112 | `js/components/lead-drawer.js`: **Slide-over Drawer** (يمين، ~70% عرض) يعرض كل حقول Lead واحد عند النقر على اسمه — الخلفية تبقى معتّمة، لوحة منزلقة فيها رأس (اسم كبير + أزرار دائرية ملوّنة + قائمة مرحلة "Rotation ▾" + `···` + `✕`) + شريحة هاتف + وسوم + شبكة معلومات 4 أعمدة (الفارغ `--`) + تبويبا Timeline/Information | REQ-201(تفاصيل), REQ-207 | js/components/lead-drawer.js, css/components.css | T005, T105 | النقر على اسم أي Lead يفتح Drawer يعرض بياناته الصحيحة، ويُغلق بـ `✕`/ESC/النقر على الخلفية |
| T113 | عمود الأيقونات الداخلي داخل الـ Drawer (خلفية داكنة `#1F3355`): Avatar بحرفين ملوّن حسب المصدر + أيقونات اتصال/محادثات/مرفقات بعداد/صور/كاميرا/جهات اتصال/موقع/نسخ + زر `···` أسفله يفتح قائمة منبثقة (Logs/Selling Units/Purchased Units) تُغلق بالنقر خارجها | REQ-207 | js/components/lead-drawer.js | T112 | كل أيقونة في العمود ظاهرة، و`···` يفتح/يغلق القائمة فعليًا |
| T114 | خط زمني داخل الـ Drawer: كل حدث = دائرة أيقونة رمادية + بطاقة بحدود (نوع الحدث مثل Outbound + حالته مثل (No Answer) بخط عريض) + قائمة `···` لكل عنصر + رسالة نهاية رمادية بدل تمرير لا نهائي؛ وتبويب Information يعرض شبكة المعلومات كاملة | REQ-207 | js/components/lead-drawer.js | T112 | التبديل بين Timeline/Information يعرض محتوى مختلفًا فعليًا |
| T115 | تغيير مرحلة الـ Lead من الصف مباشرة: زر حالة داكن "Rotation ⏷" في كل صف يفتح قائمة منسدلة سريعة، والحفظ عبر `store.update` | REQ-206 | js/pages/leads.js | T105 | تغيير المرحلة من الصف يُحدّثها فورًا في الجدول وفي تفاصيل الـ Drawer |

---

## Phase 2 — P1 — استيراد جماعي، Deals، سجل التراجع، التصدير

| ID | المهمة | REQ | الملفات | التبعيات | معايير القبول |
|---|---|---|---|---|---|
| T201 | تحميل نموذج CSV فارغ بالأعمدة الـ12 | REQ-211 | js/pages/lead-bulk-import.js | Phase1 | الملف المُنزَّل يحتوي رأس الأعمدة الصحيح بالترتيب |
| T202 | رفع CSV → parsing يدوي (split بسيط، أو SheetJS) → جدول معاينة | REQ-212 | lead-bulk-import.html, js/pages/lead-bulk-import.js | T201 | رفع ملف بـ5 صفوف يعرض 5 صفوف معاينة مطابقة |
| T203 | تحقق صفي (row-level) + تمييز الصفوف الخاطئة بالأحمر مع سبب | REQ-213 | js/pages/lead-bulk-import.js | T202, T007 | صف بهاتف فارغ يظهر أحمر برسالة "phone required" ولا يُستورد عند التأكيد |
| T204 | تأكيد الاستيراد → `store.add` لكل صف صالح + توليد Lead Code لكل واحد | REQ-212 | js/pages/lead-bulk-import.js | T203, T006 | بعد التأكيد، leads.html يعرض السجلات الجديدة بأكواد متسلسلة |
| T210 | بقية الـ Bulk Actions العشرة المتبقية (Add Tags, Add Tasks, Bulk Nudge, Add to Campaign, Change Rating, Change Source, Change Wallet, Add Bulk Note, Merge Leads, Mark Todos Complete) | REQ-402, REQ-405(B6) | js/pages/leads.js | T109 | كل عملية من العشرة تُنفَّذ اختباريًا على 2 leads وتتحقق النتيجة من `store.getById` |
| T211 | `js/data/history.js`: تسجيل كل عملية جماعية مع snapshot سابق | REQ-410 | js/data/history.js, js/data/store.js | T005 | بعد أي bulk action، سجل جديد يظهر في `bulkHistory` store |
| T212 | صفحة/قسم سجل العمليات الجماعية (جدول + زر تراجع) | REQ-410 | js/pages/leads.js أو settings.html | T211 | الجدول يعرض كل العمليات بالأعمدة الستة المطلوبة |
| T213 | تنفيذ فعلي لزر "تراجع" يعيد `previousState` لكل lead متأثر | REQ-411(B13) | js/data/history.js | T211, T212 | Change Stage على 3 leads ثم تراجع → القيم تعود بالضبط لما كانت عليه قبل العملية |
| T220 | `deals.html` + `js/pages/deals.js`: جدول Deals مرتبط بـ leadId | REQ-501 | deals.html, js/pages/deals.js | T005 | كل صف صفقة يعرض اسم العميل المرتبط الصحيح (join يدوي عبر leadId) |
| T221 | اسم العميل رابط فعلي → **يفتح Drawer تفاصيل الـ Lead** (lead-drawer.js) | REQ-502(B8) | js/pages/deals.js | T220, T112 | نقر أي اسم عميل في Deals يفتح Drawer العميل الصحيح (وليس الأول دائمًا — اختبر بصفين مختلفين) |
| T222 | زر "Close" على كل صفقة مفتوحة + قائمة Won/Lost | REQ-505(B12) | js/pages/deals.js | T220 | الضغط على Close واختيار Won يغيّر status فورًا في الجدول |
| T223 | Bulk Close للصفقات القديمة | REQ-506 | js/pages/deals.js | T222, T109(نمط مشابه) | تحديد صفقتين وإغلاقهما دفعة واحدة كـ Closed Lost يعمل |
| T224 | `deal-insights.html` + رسم بياني canvas (عدد حسب الحالة + قيمة حسب الشهر) | REQ-503 | deal-insights.html, js/pages/deal-insights.js | T220 | الرسم يعكس بيانات فعلية من store، ليس بيانات وهمية ثابتة |
| T225 | فلاتر Deals (تاريخ/حالة/agent) | REQ-504 | js/pages/deals.js | T220, filter-bar.js | نفس معيار T108 لكن على Deals |
| T226 | أيقونة الإعدادات ⚙️ في Deals تفتح `settings.html` فعليًا | REQ-507(B9) | js/pages/deals.js, settings.html | T220 | النقر ينتقل فعليًا، لا يبقى بلا استجابة |
| T230 | `js/utils/export.js`: تصدير CSV حقيقي من بيانات الجدول المفلترة الحالية | REQ-801 | js/utils/export.js | T108 | فتح الملف المُصدَّر في محرر نصوص يطابق الصفوف المعروضة فقط |
| T231 | تصدير Excel عبر SheetJS (CDN) — ملف .xlsx حقيقي مختلف عن CSV | REQ-802(B7) | js/utils/export.js | T230 | فتح .xlsx في Excel/LibreOffice يعرض جدولًا مُنسَّقًا حقيقيًا لا نصًا خامًا |
| T232 | تصدير PDF (رسم جدول يدوي على canvas أو jsPDF) | REQ-803(B7) | js/utils/export.js | T230 | الملف الناتج PDF فعلي (magic bytes `%PDF`) يحتوي جدولًا مقروءًا |
| T233 | تصدير JSON مُنسَّق (pretty-print) مطابق لنموذج البيانات | REQ-804(B7) | js/utils/export.js | T230 | `JSON.parse` على الملف الناتج لا يرمي خطأ ويطابق عدد السجلات المعروضة |

---

## Phase 3 — P2 — Marketing، Inventory، فلاتر متقدمة

| ID | المهمة | REQ | الملفات | التبعيات | معايير القبول |
|---|---|---|---|---|---|
| T301 | `marketing.html` + قائمة حملات مع بحث/فلاتر/زر جديد | REQ-601 | marketing.html, js/pages/marketing.js | Phase1 | القائمة تعرض حملات seed تجريبية |
| T302 | `marketing-add.html` نموذج حملة كامل | REQ-602 | marketing-add.html, js/pages/marketing-add.js | T301, T006 | الحفظ ينشئ CM-000xxx جديد يظهر في القائمة |
| T310 | `inventory.html` قائمة وحدات + بحث موسّع (عنوان/موقع/نوع/سعر) | REQ-701, REQ-702(B11) | inventory.html, js/pages/inventory.js | Phase1 | البحث بكلمة من الموقع (وليس الهاتف) يُرجع نتائج صحيحة |
| T311 | كل أيقونات إجراءات الوحدة مربوطة فعليًا (view/edit/delete) | REQ-703(B10) | js/pages/inventory.js | T310, T010 | كل أيقونة تُنفّذ فعلها المطابق فعليًا، لا يبقى أي أيقونة بلا معالج حدث |
| T312 | `inventory-add.html` نموذج إضافة وحدة + رفع صور (base64 → IndexedDB) | REQ-709 | inventory-add.html, js/pages/inventory-add.js | T310, T006, T007 | حفظ وحدة بصورتين يخزّنهما فعليًا ويعرضهما في التفاصيل |
| T313 | `inventory-detail.html`: View/Edit/Update/Delete | REQ-704 | inventory-detail.html, js/pages/inventory-detail.js | T312 | تعديل السعر ثم حفظ يعكس القيمة الجديدة فورًا |
| T314 | تحديد Publish Time (يُفعَّل فقط بعد اكتمال الحقول الإلزامية) | REQ-705 | js/pages/inventory-detail.js | T313 | محاولة النشر بحقل ناقص تُمنع برسالة توضيحية |
| T315 | توليد `publishUrl` فريد + عرضه كرابط قابل للنسخ | REQ-706 | js/pages/inventory-detail.js, js/utils/id-generator.js | T314 | رابطان لوحدتين مختلفتين لا يتطابقان أبدًا |
| T316 | `public/unit.html` + `js/pages/public-unit.js`: صفحة عامة تعرض الوحدة وتحتوي نموذج عميل | REQ-707 | public/unit.html, js/pages/public-unit.js | T315 | فتح الرابط في نافذة تصفح خاصة (بدون أي تسجيل دخول) يعرض تفاصيل الوحدة الصحيحة |
| T317 | إرسال نموذج العميل العام → إنشاء Lead جديد (source="Public Listing") | REQ-708 | js/pages/public-unit.js | T316, T005 | بعد الإرسال، leads.html يعرض Lead جديدًا بالمصدر الصحيح |
| T320 | فلاتر متقدمة: تركيب شروط متعددة + فلتر `Assign From (Agent X)` | REQ-303 | js/components/filter-bar.js | T108 | تفعيل فلترين معًا (rating=Hot AND assignedTo=Agent2) يُرجع تقاطع النتائج فقط |
| T321 | حفظ مخطط فلترة (localStorage) | REQ-305 | js/components/filter-bar.js | T320 | إعادة تحميل الصفحة تستعيد آخر فلتر محفوظ إن اختار المستخدم ذلك |

---

## Phase 4 — الصقل النهائي (Polish)

| ID | المهمة | REQ | معايير القبول |
|---|---|---|---|
| T401 | مؤشرات تحميل لكل عملية IndexedDB > 200ms | REQ-902 | تحميل 1000 سجل تجريبي يعرض skeleton أثناء الجلب |
| T402 | شريط تقدم للعمليات الجماعية > 20 عنصرًا | REQ-903 | Bulk action على 50 عنصرًا تعرض progress bar متحركًا |
| T403 | تجاوب Tablet (768-1024px) | REQ-904 | الشريط الجانبي يتحول لقائمة قابلة للطي عند 1024px |
| T404 | تجاوب Mobile أساسي (<768px) | REQ-904 | الجداول تتحول لبطاقات مكدّسة أو scroll أفقي بدون كسر التخطيط |
| T405 | مراجعة شاملة لقائمة B1–B14 مقابل `01-specify.md § مصفوفة تتبع الأخطاء` | كل REQ | كل صف في الجدول محدد كـ "تم التحقق" يدويًا |
| T406 | اختبار أداء: 1000+ Lead → تفعيل Virtual Scrolling في data-table.js | §8.1 من المستند الأصلي | التمرير في جدول بـ1000+ صف يبقى سلسًا (لا تجميد) |

---

## ملخص التبعيات (Critical Path)

```
Phase 0 (T001-T011)
   └─▶ Phase 1 (T101-T112)
          └─▶ Phase 2 (T201-T233)
                 └─▶ Phase 3 (T301-T321)
                        └─▶ Phase 4 (T401-T406)
```

لا تبدأ أي مرحلة قبل اكتمال كل مهام المرحلة السابقة (خاصة Phase 0 — هي الأساس الذي يعتمد عليه كل شيء).
