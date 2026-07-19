# 02 — Plan (البنية التقنية)

## 1. هيكل الملفات النهائي (ثابت — لا تُغيّر بدون تحديث هذا الملف)

```
crm-app/
├── index.html                     # Dashboard
├── leads.html                     # /leads
├── lead-add.html                  # /leads/add
├── lead-bulk-import.html          # /leads/bulk-import
├── lead-detail.html               # /leads/:id  (?id=LD-000001)
├── deals.html                     # /deals
├── deal-insights.html             # /deals/insights
├── marketing.html                 # /marketing
├── marketing-add.html             # /marketing/add
├── inventory.html                 # /inventory
├── inventory-add.html             # /inventory/add
├── inventory-detail.html          # /inventory/:id
├── settings.html                  # /settings
├── public/
│   └── unit.html                  # صفحة النشر العامة  ?code=publishUrl
├── css/
│   ├── base.css                   # متغيرات الألوان، reset، typography
│   ├── layout.css                 # الشريط الجانبي، الشريط العلوي
│   ├── components.css             # أزرار، بطاقات، جداول، Toast، Modal
│   └── pages/
│       ├── dashboard.css
│       ├── leads.css
│       ├── deals.css
│       ├── marketing.css
│       └── inventory.css
├── js/
│   ├── data/
│   │   ├── db.js                  # فتح/تهيئة IndexedDB (schema, version)
│   │   ├── store.js                # طبقة CRUD الوحيدة المسموحة (get/add/update/bulkUpdate/delete)
│   │   ├── seed.js                 # بيانات تجريبية أولية (demo data)
│   │   └── history.js              # تسجيل/تراجع العمليات الجماعية
│   ├── utils/
│   │   ├── format.js               # تنسيق تواريخ/أرقام/عملة
│   │   ├── validate.js             # قواعد التحقق (§4 أدناه)
│   │   ├── id-generator.js         # توليد Lead Code / Deal ID / Unit ID
│   │   └── export.js               # csv/xlsx/pdf/json (يستخدم CDN لـ SheetJS و jsPDF فقط)
│   ├── components/
│   │   ├── toast.js
│   │   ├── modal.js
│   │   ├── date-range.js           # مكوّن نطاق التاريخ القابل لإعادة الاستخدام
│   │   ├── data-table.js           # جدول عام: فرز، صفحات، تحديد صفوف
│   │   └── filter-bar.js
│   └── pages/
│       ├── dashboard.js
│       ├── leads.js
│       ├── lead-add.js
│       ├── lead-bulk-import.js
│       ├── lead-detail.js
│       ├── deals.js
│       ├── deal-insights.js
│       ├── marketing.js
│       ├── marketing-add.js
│       ├── inventory.js
│       ├── inventory-add.js
│       ├── inventory-detail.js
│       ├── settings.js
│       └── public-unit.js
└── assets/
    └── icons/                      # SVG icons (لا صور خارجية بلا ترخيص)
```

> **قاعدة**: كل صفحة `.html` تستورد ملف JS واحد فقط من `js/pages/` بـ `<script type="module" src="...">`. لا منطق JS داخل HTML مباشرة (لا `onclick=""` مضمّنة).

## 2. نماذج البيانات (طابق §5 من المستند الأصلي حرفيًا + حقول إضافية ضرورية)

```javascript
// js/data/models.jsdoc.js — للتوثيق فقط، ليس للتنفيذ

/** @typedef {Object} Lead
 * @property {string} id            // "LD-000001" — REQ-203
 * @property {string} name
 * @property {string} phone
 * @property {string} email
 * @property {string} source
 * @property {'Hot'|'Warm'|'Cold'} rating
 * @property {string} stage
 * @property {string} assignedTo    // Agent id
 * @property {string} createdDate   // ISO date, أو {from,to} إن كان range
 * @property {string} [activityDate]
 * @property {string} [assignmentDate]
 * @property {string} [note]
 * @property {string[]} tags
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {boolean} isDeleted
 */

/** @typedef {Object} Deal
 * @property {string} id            // "DL-000001"
 * @property {string} leadId
 * @property {'Open'|'Won'|'Lost'} status
 * @property {number} amount
 * @property {string} [closedDate]
 * @property {string} assignedTo
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @typedef {Object} Campaign
 * @property {string} id            // "CM-000001"
 * @property {string} name
 * @property {string} type
 * @property {string} startDate
 * @property {string} endDate
 * @property {string} targetAudience
 * @property {'Draft'|'Active'|'Completed'} status
 */

/** @typedef {Object} InventoryUnit
 * @property {string} id            // "UN-000001"
 * @property {string} unitType
 * @property {number} area
 * @property {number} price
 * @property {string} location
 * @property {string} layout
 * @property {string} description
 * @property {string[]} images      // base64 data URLs
 * @property {string} [publishTime]
 * @property {string} [publishUrl]  // مثال: "unit-a1b2c3"
 * @property {'Draft'|'Published'} status
 */

/** @typedef {Object} BulkActionHistoryEntry
 * @property {string} id
 * @property {string} actionType
 * @property {string[]} affectedLeadIds
 * @property {string} performedBy
 * @property {string} performedAt
 * @property {Object} details
 * @property {Object[]} previousState  // snapshot لكل lead قبل التعديل — لازم للتراجع REQ-411
 * @property {boolean} isUndone
 */
```

## 3. IndexedDB Schema (`js/data/db.js`)

- DB name: `crm_db`, version: `1`
- Object stores: `leads` (keyPath: `id`), `deals` (keyPath: `id`), `campaigns` (keyPath: `id`), `units` (keyPath: `id`), `bulkHistory` (keyPath: `id`)
- Indexes المطلوبة (لأداء البحث/الفلترة):
  - `leads`: `rating`, `stage`, `assignedTo`, `source`, `createdDate`
  - `deals`: `leadId`, `status`
  - `units`: `publishUrl`, `status`

## 4. قواعد التحقق (`js/utils/validate.js`)

| الحقل | القاعدة |
|---|---|
| name | مطلوب، 2-100 حرف |
| phone | مطلوب، أرقام فقط (+ اختياري)، 7-15 رقمًا |
| email | اختياري، regex بريد قياسي إن وُجد |
| source/rating/stage/assignedTo | مطلوب، يجب أن يطابق قيمة من قائمة محددة مسبقًا في `js/data/constants.js` |

أنشئ `js/data/constants.js` يحوي القوائم الثابتة: `SOURCES`, `STAGES`, `RATINGS = ['Hot','Warm','Cold']`, `AGENTS` (بيانات تجريبية).

## 5. طبقة `store.js` — العقد الوحيد للوصول للبيانات

```javascript
// التوقيعات المطلوبة بالضبط (الأسماء ثابتة):
export async function getAll(entity)                 // 'leads'|'deals'|'campaigns'|'units'
export async function getById(entity, id)
export async function add(entity, record)             // يولّد id عبر id-generator.js
export async function update(entity, id, patch)
export async function bulkUpdate(entity, ids, patch)   // يُستخدم لكل الـ 13 bulk action
export async function bulkDelete(entity, ids)
export async function query(entity, filterFn)          // فلترة عامة
```

كل دالة تُطلق حدث `crm:<entity>:updated` بعد نجاحها (عبر `window.dispatchEvent(new CustomEvent(...))`) — هذا ما يجعل REQ-104 (تحديث فوري للـ Dashboard) يعمل دون polling.

## 6. آلية توليد المعرّفات (`id-generator.js`)

Prefix ثابت لكل كيان: Lead=`LD`, Deal=`DL`, Campaign=`CM`, Unit=`UN`. صيغة: `PREFIX-XXXXXX` (padStart 6 أصفار)، رقم تسلسلي محفوظ في `localStorage` تحت مفتاح `crm_counter_<entity>`.

## 7. آلية الرابط العام (Publish URL) — REQ-706/707

`publishUrl` = string عشوائي فريد (8 أحرف). الرابط الفعلي: `public/unit.html?code=<publishUrl>`. صفحة `public-unit.js` تقرأ `code` من query string، تبحث عن الوحدة بمطابقة `publishUrl` عبر `store.query('units', u => u.publishUrl === code)`، وعند إرسال نموذج العميل تستدعي `store.add('leads', {..., source:'Public Listing'})`.

## 8. الرسوم البيانية (Insights) — REQ-503

بدون مكتبة خارجية: استخدم `<canvas>` ورسم يدوي بسيط (bar chart أعمدة). إذا رغب فريق التنفيذ باستخدام Chart.js عبر CDN، يجب تسجيل ذلك كاستثناء صريح في `00-constitution.md § 1` أولاً.

## 9. الألوان والمتغيرات (`css/base.css`)

```css
:root{
  --color-hot:#FF4444; --color-warm:#FF8C00; --color-cold:#2196F3;
  --color-primary:#4CAF50; --color-danger:#F44336;
  --color-text:#333333; --color-text-secondary:#666666;
  --color-border:#E0E0E0; --color-bg:#F5F7FA;
  --radius-btn:6px; --radius-card:8px;
}
```
