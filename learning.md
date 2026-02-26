# ShiftFlow - React & Next.js სასწავლო გზამკვლევი

> ანგულარ დეველოპერებისთვის, ვინც Next.js-ზე გადადის

---

## სარჩევი

1. [პროექტის ანალიზი - რას აკეთებს ShiftFlow?](#1-პროექტის-ანალიზი)
2. [React საფუძვლები (Angular-ის ანალოგიებით)](#2-react-საფუძვლები)
3. [Next.js - რა არის და როგორ მუშაობს](#3-nextjs---რა-არის-და-როგორ-მუშაობს)
4. [პროექტის სტრუქტურა და ფაილების ორგანიზება](#4-პროექტის-სტრუქტურა)
5. [Routing - მარშრუტიზაცია](#5-routing)
6. [Server Components vs Client Components](#6-server-vs-client-components)
7. [Server Actions - სერვერის მოქმედებები](#7-server-actions)
8. [Authentication & Middleware](#8-authentication--middleware)
9. [Supabase - მონაცემთა ბაზა](#9-supabase)
10. [სტილიზაცია - Tailwind CSS + Shadcn/ui](#10-სტილიზაცია)
11. [State Management](#11-state-management)
12. [TypeScript ინტეგრაცია](#12-typescript)
13. [პრაქტიკული მაგალითები პროექტიდან](#13-პრაქტიკული-მაგალითები)
14. [Angular vs React/Next.js - შედარების ცხრილი](#14-შედარების-ცხრილი)
15. [ხშირად დაშვებული შეცდომები](#15-ხშირი-შეცდომები)
16. [რჩევები და ბესთ პრაქტიკები](#16-რჩევები)

---

## 1. პროექტის ანალიზი

### რას აკეთებს ShiftFlow?

**ShiftFlow** არის ცვლების მართვის პლატფორმა (Shift Management Platform). ის საშუალებას აძლევს კომპანიებს მართონ თანამშრომლების ცვლები, განრიგი და ცვლების გაცვლა.

### სამი როლი

```
Owner (მფლობელი)
├── ხედავს მთლიანი კომპანიის მონაცემებს
├── მართავს მენეჯერებს
├── ხედავს აქტივობის ლოგებს
└── ეგზავნება თვიური რეპორტები

Manager (მენეჯერი)
├── ქმნის ჯგუფებს (მაგ: "დილის ცვლა", "ღამის ცვლა")
├── ქმნის ცვლის შაბლონებს (მაგ: "09:00-17:00")
├── ადგენს კვირის განრიგს
├── ამტკიცებს/უარყოფს ცვლის გაცვლებს
└── ექსპორტავს განრიგს Excel-ში

Employee (თანამშრომელი)
├── ხედავს თავის ცვლებს
├── ითხოვს ცვლის გაცვლას (პირდაპირი ან საჯარო)
├── ხედავს გუნდის განრიგს
└── მართავს თავის ანგარიშს
```

### ცვლის გაცვლის ბიზნეს ლოგიკა

```
პირდაპირი (Direct) გაცვლა:
  თანამშრომელი A → ითხოვს → თანამშრომელი B → იღებს/უარყოფს → მენეჯერი → ამტკიცებს/უარყოფს

საჯარო (Public) გაცვლა:
  თანამშრომელი A → აქვეყნებს → ნებისმიერი კოლეგა → იღებს → მენეჯერი → ამტკიცებს/უარყოფს

სტატუსების ჯაჭვი:
  pending_employee → accepted_by_employee → pending_manager → approved / rejected
```

### ტექნოლოგიური სტეკი

| ტექნოლოგია | რისთვის |
|---|---|
| **Next.js 14** | ფრეიმვორქი (App Router) |
| **React 18** | UI ბიბლიოთეკა |
| **TypeScript** | ტიპიზაცია |
| **Supabase** | მონაცემთა ბაზა + ავტენტიფიკაცია |
| **Tailwind CSS** | სტილიზაცია |
| **Shadcn/ui** | UI კომპონენტები |
| **Lucide React** | იკონები |
| **Sonner** | Toast შეტყობინებები |
| **ExcelJS** | Excel ექსპორტი |

---

## 2. React საფუძვლები

### Angular-ის ანალოგიებით

#### კომპონენტი

**Angular-ში:**
```typescript
// app.component.ts
@Component({
  selector: 'app-hello',
  template: `<h1>Hello {{ name }}</h1>`,
  styles: [`h1 { color: blue; }`]
})
export class HelloComponent {
  name = 'World';
}
```

**React-ში:**
```tsx
// hello.tsx
function Hello() {
  const name = 'World';
  return <h1 style={{ color: 'blue' }}>Hello {name}</h1>;
}
```

**განსხვავებები:**
- React-ში **არ არის** decorator-ები (`@Component`, `@Injectable`)
- React-ში **არ არის** module სისტემა (`NgModule`)
- React კომპონენტი არის **ჩვეულებრივი ფუნქცია** რომელიც JSX-ს აბრუნებს
- **JSX** = HTML-ის მსგავსი სინტაქსი JavaScript-ში (ანგულარის template-ის მსგავსი)

#### Props (Input)

**Angular-ში:**
```typescript
// child.component.ts
@Input() title: string;
@Input() count: number;

// parent template
<app-child [title]="'Hello'" [count]="5"></app-child>
```

**React-ში:**
```tsx
// Child.tsx
function Child({ title, count }: { title: string; count: number }) {
  return <div>{title}: {count}</div>;
}

// Parent.tsx
function Parent() {
  return <Child title="Hello" count={5} />;
}
```

**მთავარი განსხვავება:** React-ში Props-ები ფუნქციის პარამეტრებია, არა decorator-ები.

#### State (ცვლადების მართვა)

**Angular-ში:**
```typescript
export class CounterComponent {
  count = 0; // ცვლადი

  increment() {
    this.count++; // პირდაპირ ვცვლით
  }
}
```

**React-ში:**
```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0); // state hook

  function increment() {
    setCount(count + 1); // setter-ით ვცვლით
  }

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

**მთავარი განსხვავება:**
- Angular-ში ცვლადი პირდაპირ იცვლება (`this.count++`), ხოლო
- React-ში **აუცილებლად** `setState` ფუნქციით უნდა შეცვალო. პირდაპირ მუტაცია **არ მუშაობს** - UI არ განახლდება!

#### Hooks (React-ის "სერვისები")

React-ში hooks = ანგულარის services + lifecycle methods. ეს არის ფუნქციები, რომლებიც `use`-ით იწყება.

| React Hook | Angular ანალოგი | რას აკეთებს |
|---|---|---|
| `useState` | class property | ლოკალური state |
| `useEffect` | `ngOnInit` + `ngOnDestroy` | side effects, lifecycle |
| `useRef` | `@ViewChild` | DOM ელემენტზე წვდომა |
| `useContext` | Service с DI | გლობალური მონაცემების გაზიარება |
| `useMemo` | pipe (pure) | გამოთვლის მემოიზაცია |
| `useCallback` | - | ფუნქციის მემოიზაცია |
| `useRouter` (Next.js) | `Router` service | ნავიგაცია |
| `useTransition` | - | არა-ურგენტი state განახლება |

#### useEffect - Lifecycle

**Angular-ში:**
```typescript
export class UserComponent implements OnInit, OnDestroy {
  userId: string;
  subscription: Subscription;

  ngOnInit() {
    this.subscription = this.userService.getUser(this.userId)
      .subscribe(user => this.user = user);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
```

**React-ში:**
```tsx
import { useState, useEffect } from 'react';

function UserComponent({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // ეს ngOnInit-ის მსგავსია
    const subscription = fetchUser(userId).then(setUser);

    // return ფუნქცია = ngOnDestroy
    return () => {
      // cleanup logic
    };
  }, [userId]); // dependency array - გაეშვება მხოლოდ userId-ის შეცვლისას

  return <div>{user?.name}</div>;
}
```

**useEffect-ის dependency array:**
- `useEffect(() => {}, [])` — ერთხელ (ngOnInit)
- `useEffect(() => {}, [userId])` — userId-ის შეცვლისას
- `useEffect(() => {})` — ყოველ რენდერზე (ნუ გააკეთებ ამას!)

#### Event Handling (მოვლენების დამუშავება)

**Angular-ში:**
```html
<button (click)="handleClick()">Click</button>
<input (input)="onInput($event)">
<form (ngSubmit)="onSubmit()">
```

**React-ში:**
```tsx
<button onClick={handleClick}>Click</button>
<input onChange={(e) => setName(e.target.value)} />
<form onSubmit={handleSubmit}>
```

**განსხვავებები:**
- `(click)` → `onClick` (camelCase)
- `(input)` → `onChange`
- `(ngSubmit)` → `onSubmit`
- `$event` → პარამეტრი callback-ში

#### Conditional Rendering (პირობითი ჩვენება)

**Angular-ში:**
```html
<div *ngIf="isLoading">Loading...</div>
<div *ngIf="!isLoading">Content</div>

<!-- ან Angular 17+ -->
@if (isLoading) {
  <div>Loading...</div>
} @else {
  <div>Content</div>
}
```

**React-ში:**
```tsx
function Component() {
  if (isLoading) return <div>Loading...</div>;

  return <div>Content</div>;
}

// ან inline
function Component() {
  return (
    <div>
      {isLoading ? <div>Loading...</div> : <div>Content</div>}
      {showBanner && <Banner />}
    </div>
  );
}
```

**განსხვავება:** React-ში **არ არის** structural directives. ჩვეულებრივი JavaScript ლოგიკა გამოიყენება.

#### Lists (სიების ჩვენება)

**Angular-ში:**
```html
<ul>
  <li *ngFor="let item of items; trackBy: trackById">
    {{ item.name }}
  </li>
</ul>
```

**React-ში:**
```tsx
function List({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

**განსხვავება:**
- `*ngFor` → `.map()` JavaScript მეთოდი
- `trackBy` → `key` prop (აუცილებელია!)

#### Two-Way Binding (ორმხრივი ბაინდინგი)

**Angular-ში:**
```html
<input [(ngModel)]="name">
```

**React-ში:**
```tsx
function Form() {
  const [name, setName] = useState('');

  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  );
}
```

**განსხვავება:** React-ში **არ არის** two-way binding! ყოველთვის:
1. `value` = state-დან კითხულობ
2. `onChange` = state-ს აახლებ

ეს ერთი შეხედვით მეტი კოდია, მაგრამ უფრო predictable და debug-ისთვის ადვილია.

---

## 3. Next.js - რა არის და როგორ მუშაობს

### Next.js = React Framework

**Angular-ის ანალოგია:**
- **React** = ვიზუალური ბიბლიოთეკა (კომპონენტები, state) — ანგულარის core-ის მსგავსი
- **Next.js** = სრული ფრეიმვორქი (routing, SSR, API) — ანგულარის CLI + Router + SSR-ის მსგავსი

### რატომ Next.js?

React თავისთავად მხოლოდ UI ბიბლიოთეკაა. Next.js ამატებს:

| ფუნქციონალი | React (vanilla) | Next.js |
|---|---|---|
| Routing | react-router ხელით | ფაილზე დაფუძნებული (ავტომატური) |
| SSR | ხელით კონფიგურაცია | ჩაშენებული |
| API Routes | Express.js ცალკე | ჩაშენებული |
| Code Splitting | ხელით | ავტომატური |
| Image Optimization | ხელით | `<Image>` კომპონენტი |
| SEO | რთული | Server Components-ით მარტივი |

### რენდერინგის ტიპები

Next.js-ში არის რამდენიმე გზა გვერდის დარენდერებისთვის:

```
1. SSR (Server-Side Rendering)
   - სერვერზე რენდერდება ყოველ მოთხოვნაზე
   - SEO-სთვის კარგია
   - Angular Universal-ის მსგავსი

2. SSG (Static Site Generation)
   - Build-ის დროს გენერირდება
   - ყველაზე სწრაფი
   - ბლოგი, დოკუმენტაცია

3. ISR (Incremental Static Regeneration)
   - სტატიკური + პერიოდული განახლება
   - SSG + cache revalidation

4. CSR (Client-Side Rendering)
   - ბრაუზერში რენდერდება
   - ანგულარის ნაგულისხმევი რეჟიმი
   - Next.js-ში "use client" კომპონენტები
```

### App Router vs Pages Router

Next.js-ს ორი routing სისტემა აქვს:
- **Pages Router** (ძველი) — `pages/` დირექტორიაში
- **App Router** (ახალი, Next.js 13+) — `app/` დირექტორიაში

**ShiftFlow იყენებს App Router-ს** — ეს არის თანამედროვე მიდგომა.

---

## 4. პროექტის სტრუქტურა

```
shift-flow/
│
├── app/                          # 🔵 Next.js App Router (ანგულარის app/ მსგავსი)
│   │
│   ├── layout.tsx                # Root Layout (ანგულარის AppComponent)
│   ├── page.tsx                  # მთავარი გვერდი "/" (Landing)
│   ├── globals.css               # გლობალური სტილები
│   │
│   ├── (dashboard)/              # Route Group (URL-ში არ ჩანს)
│   │   ├── layout.tsx            # Dashboard Layout (Sidebar + Nav)
│   │   ├── loading.tsx           # Loading skeleton
│   │   │
│   │   ├── employee/             # /employee რაუთები
│   │   │   ├── page.tsx          # /employee (ჩემი განრიგი)
│   │   │   ├── layout.tsx        # Employee layout
│   │   │   ├── swaps/page.tsx    # /employee/swaps
│   │   │   ├── team/page.tsx     # /employee/team
│   │   │   └── account/page.tsx  # /employee/account
│   │   │
│   │   ├── manager/              # /manager რაუთები
│   │   │   ├── page.tsx          # /manager (Dashboard)
│   │   │   ├── employees/page.tsx
│   │   │   ├── groups/page.tsx
│   │   │   ├── groups/[id]/page.tsx  # დინამიური რაუთი
│   │   │   ├── schedule/page.tsx
│   │   │   └── swaps/page.tsx
│   │   │
│   │   └── owner/                # /owner რაუთები
│   │       ├── page.tsx
│   │       └── managers/page.tsx
│   │
│   ├── auth/                     # ავტორიზაციის გვერდები
│   │   ├── login/page.tsx
│   │   ├── sign-up/page.tsx
│   │   └── ...
│   │
│   ├── actions/                  # Server Actions
│   │   ├── auth.ts
│   │   ├── employee.ts
│   │   ├── manager.ts
│   │   ├── schedule.ts
│   │   └── owner.ts
│   │
│   └── api/                      # API Routes
│       ├── export-schedule/route.ts
│       └── export-monthly-report/route.ts
│
├── components/                   # 🟢 React კომპონენტები
│   ├── ui/                       # Shadcn/ui კომპონენტები
│   ├── auth/                     # ავტორიზაციის ფორმები
│   ├── employee/                 # თანამშრომლის კომპონენტები
│   ├── manager/                  # მენეჯერის კომპონენტები
│   ├── owner/                    # მფლობელის კომპონენტები
│   └── layout/                   # Layout კომპონენტები
│
├── lib/                          # 🟡 Utilities & Config
│   ├── supabase/                 # Supabase კლიენტები
│   │   ├── client.ts             # ბრაუზერის კლიენტი
│   │   ├── server.ts             # სერვერის კლიენტი
│   │   ├── service.ts            # Admin კლიენტი
│   │   └── middleware.ts         # Session მართვა
│   ├── types/
│   │   └── database.types.ts     # DB ტიპები
│   └── utils.ts                  # Helper ფუნქციები
│
├── middleware.ts                  # 🔴 Next.js Middleware (Route Guard)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### Angular-თან შედარება

| Next.js | Angular | დანიშნულება |
|---|---|---|
| `app/layout.tsx` | `app.component.ts` | Root component |
| `app/page.tsx` | `app-routing.module.ts` → component | Route component |
| `app/(dashboard)/layout.tsx` | ChildRoute with component | Nested layout |
| `components/` | `src/app/shared/` | Reusable components |
| `lib/` | `src/app/core/` | Services, utilities |
| `middleware.ts` | Route Guards | Route protection |
| `app/actions/` | Services (HTTP calls) | Backend logic |
| `app/api/` | Backend API | API endpoints |

---

## 5. Routing

### ფაილზე დაფუძნებული Routing

Next.js App Router-ში **ფაილის მდებარეობა = URL**:

```
app/page.tsx                    →  /
app/auth/login/page.tsx         →  /auth/login
app/(dashboard)/employee/page.tsx →  /employee    (dashboard არ ჩანს URL-ში!)
app/(dashboard)/manager/groups/[id]/page.tsx  →  /manager/groups/123
```

**Angular-ში:**
```typescript
// app-routing.module.ts
const routes = [
  { path: '', component: HomeComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'employee', component: EmployeeComponent },
  { path: 'manager/groups/:id', component: GroupDetailComponent },
];
```

### სპეციალური ფაილები

Next.js App Router-ში სპეციალური სახელების ფაილები აქვს:

| ფაილი | Angular ანალოგი | დანიშნულება |
|---|---|---|
| `page.tsx` | Route Component | გვერდის კომპონენტი |
| `layout.tsx` | Component with `<router-outlet>` | საერთო layout |
| `loading.tsx` | Loading spinner | Loading state |
| `error.tsx` | ErrorHandler | Error boundary |
| `not-found.tsx` | Wildcard route | 404 გვერდი |
| `route.ts` | Backend API endpoint | API Route Handler |

### Layout System

**Angular-ში** layout-ს ასე აკეთებ:
```typescript
// dashboard.component.ts
@Component({
  template: `
    <app-sidebar></app-sidebar>
    <main>
      <router-outlet></router-outlet>
    </main>
  `
})
export class DashboardComponent {}
```

**Next.js-ში:**
```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({
  children, // <-- ეს არის router-outlet-ის ანალოგი!
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

### Route Groups — `(dashboard)`

`(dashboard)` ფრჩხილებში ჩასმული სახელი **არ ჩანს URL-ში**. ეს არის ორგანიზაციული ინსტრუმენტი:

```
app/(dashboard)/employee/page.tsx  →  /employee  (არა /dashboard/employee!)
app/(dashboard)/manager/page.tsx   →  /manager
```

**რატომ?** რომ ამ როუტებს საერთო layout.tsx ჰქონდეთ (sidebar, nav), მაგრამ URL-ში `dashboard` არ გამოჩნდეს.

### Dynamic Routes — `[id]`

**Angular-ში:**
```typescript
{ path: 'groups/:id', component: GroupDetailComponent }

// კომპონენტში
this.route.params.subscribe(params => {
  this.groupId = params['id'];
});
```

**Next.js-ში:**
```
app/manager/groups/[id]/page.tsx
```

```tsx
// page.tsx (Server Component)
export default async function GroupPage({
  params,
}: {
  params: { id: string };
}) {
  const group = await fetchGroup(params.id);
  return <GroupDetail group={group} />;
}
```

### ნავიგაცია

**Angular-ში:**
```typescript
// template
<a routerLink="/employee/swaps">Swaps</a>

// component
this.router.navigate(['/employee/swaps']);
```

**Next.js-ში:**
```tsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// template-ში
<Link href="/employee/swaps">Swaps</Link>

// პროგრამულად
function Component() {
  const router = useRouter();
  router.push('/employee/swaps');
}
```

---

## 6. Server Components vs Client Components

### ეს არის Next.js-ის ყველაზე მნიშვნელოვანი კონცეფცია!

Next.js 13+ App Router-ში კომპონენტები ორი ტიპისაა:

### Server Components (ნაგულისხმევი)

```tsx
// app/(dashboard)/manager/page.tsx
// ეს არის Server Component (ნაგულისხმევად!)
// სერვერზე ეშვება, ბრაუზერში არ იტვირთება

export default async function ManagerDashboard() {
  // შეგიძლია პირდაპირ მონაცემთა ბაზას მიმართო!
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'employee');

  return (
    <div>
      <h1>Dashboard</h1>
      <p>თანამშრომლები: {employees?.length}</p>
    </div>
  );
}
```

**Server Component-ის თვისებები:**
- სერვერზე ეშვება
- **შეუძლია:** `async/await`, პირდაპირი DB წვდომა, ფაილების კითხვა
- **არ შეუძლია:** `useState`, `useEffect`, `onClick`, ბრაუზერის API-ები
- JavaScript **არ იგზავნება** კლიენტზე → სწრაფია!

### Client Components

```tsx
// components/employee/my-schedule-client.tsx
"use client"; // <-- ეს ხაზი აქცევს Client Component-ად!

import { useState } from 'react';

export function MyScheduleClient({ shifts }) {
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  return (
    <div>
      <button onClick={() => setSelectedWeek(prev)}>წინა კვირა</button>
      {shifts.map(shift => (
        <ShiftCard key={shift.id} shift={shift} />
      ))}
    </div>
  );
}
```

**Client Component-ის თვისებები:**
- ბრაუზერში ეშვება
- **შეუძლია:** `useState`, `useEffect`, `onClick`, ბრაუზერის API-ები
- **არ შეუძლია:** პირდაპირი DB წვდომა, `async` კომპონენტი
- JavaScript **იგზავნება** კლიენტზე

### როდის რომელი გამოვიყენო?

```
Server Component (ნაგულისხმევი) გამოიყენე:
  ✅ მონაცემების ჩატვირთვა (fetch, DB query)
  ✅ სტატიკური UI (header, footer, cards)
  ✅ სენსიტიური ლოგიკა (API keys, secrets)
  ✅ დიდი ბიბლიოთეკები (markdown, syntax highlight)

Client Component ("use client") გამოიყენე:
  ✅ ინტერაქტიულობა (click, hover, drag)
  ✅ ფორმები (input, select)
  ✅ State მართვა (useState, useReducer)
  ✅ Browser API (localStorage, geolocation)
  ✅ useEffect (subscriptions, timers)
```

### ShiftFlow-ს პატერნი: Server Page + Client Island

პროექტში ეს პატერნი გამოიყენება:

```tsx
// app/(dashboard)/employee/page.tsx — SERVER Component
export default async function EmployeePage() {
  // სერვერზე ჩატვირთვა
  const supabase = await createClient();
  const { data: shifts } = await supabase.from('shifts').select('*');

  // Client Component-ს გადაეცემა მონაცემები props-ით
  return <MyScheduleClient shifts={shifts} />;
}
```

```tsx
// components/employee/my-schedule-client.tsx — CLIENT Component
"use client";

export function MyScheduleClient({ shifts }) {
  // ინტერაქტიული ლოგიკა
  const [filter, setFilter] = useState('all');
  // ...
}
```

**ანგულარის ანალოგია:** წარმოიდგინე resolver + component. Resolver-ი სერვერზე ჩატვირთავს მონაცემებს, კომპონენტი ბრაუზერში აჩვენებს.

---

## 7. Server Actions

### რა არის Server Actions?

Server Actions = **სერვერის ფუნქციები, რომლებსაც კლიენტი პირდაპირ იძახებს**.

**Angular-ში ეს ასე კეთდება:**
```typescript
// service.ts
@Injectable()
export class ShiftService {
  constructor(private http: HttpClient) {}

  createSwap(shiftId: string, toUserId: string) {
    return this.http.post('/api/swaps', { shiftId, toUserId });
  }
}
```

**Next.js Server Action:**
```tsx
// app/actions/employee.ts
"use server"; // <-- ეს ხაზი ნიშნავს რომ სერვერზე ეშვება!

export async function createDirectSwap(shiftId: string, toUserId: string) {
  const supabase = await createClient();

  // ვამოწმებთ ავტორიზაციას
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // ბაზაში ჩაწერა
  const { error } = await supabase
    .from('shift_swaps')
    .insert({
      shift_id: shiftId,
      from_user_id: user.id,
      to_user_id: toUserId,
      type: 'direct',
      status: 'pending_employee',
    });

  if (error) throw new Error(error.message);

  // გვერდის refresh
  revalidatePath('/employee/swaps');
}
```

**კლიენტიდან გამოძახება:**
```tsx
"use client";
import { createDirectSwap } from '@/app/actions/employee';

function SwapButton({ shiftId, colleagueId }) {
  const [isPending, startTransition] = useTransition();

  function handleSwap() {
    startTransition(async () => {
      await createDirectSwap(shiftId, colleagueId);
      toast.success('მოთხოვნა გაიგზავნა!');
    });
  }

  return (
    <button onClick={handleSwap} disabled={isPending}>
      {isPending ? 'იგზავნება...' : 'ცვლის გაცვლა'}
    </button>
  );
}
```

**რატომ არის ეს მაგარი?**
- **არ გჭირდება API endpoint-ების შექმნა** — Next.js ავტომატურად ქმნის
- **Type-safe** — TypeScript ტიპები სერვერიდან კლიენტამდე
- **არ გჭირდება HTTP client** — ფუნქციის გამოძახება საკმარისია
- **revalidatePath** — ავტომატურად ანახლებს გვერდს

### ShiftFlow-ის Server Actions

```
app/actions/
├── auth.ts        → clearMustChangePassword()
├── employee.ts    → createDirectSwap(), createPublicSwap(), acceptSwap(), rejectSwap()...
├── manager.ts     → createGroup(), createShiftTemplate(), approveSwap()...
├── schedule.ts    → createSchedule(), publishSchedule(), copyFromLastWeek()...
└── owner.ts       → მენეჯერის მართვა
```

---

## 8. Authentication & Middleware

### Middleware (Route Guard)

**Angular-ში:**
```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
```

**Next.js-ში:**
```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // სესიის შემოწმება
  const supabase = createMiddlewareClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  // თუ არ არის ავტორიზებული → login
  if (!user && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // როლის შემოწმება
  const role = request.cookies.get('sf-role')?.value;
  if (role === 'employee' && pathname.startsWith('/manager')) {
    return NextResponse.redirect(new URL('/employee', request.url));
  }

  return NextResponse.next();
}
```

### ავტენტიფიკაციის ნაკადი ShiftFlow-ში

```
1. მომხმარებელი → /auth/login → email + password
2. Supabase Auth → ამოწმებს → session cookie დაბრუნება
3. Middleware → ყოველ request-ზე ამოწმებს session-ს
4. role cookie → UX-level routing (RLS აკეთებს ნამდვილ დაცვას)
5. must_change_password → პირველ login-ზე → /auth/change-password
```

### სამი Supabase Client

```
1. Server Client (lib/supabase/server.ts)
   - Server Components-ში გამოიყენება
   - RLS წესებს იცავს
   - მომხმარებლის სესია აქვს

2. Browser Client (lib/supabase/client.ts)
   - Client Components-ში
   - RLS წესებს იცავს
   - ბრაუზერში მუშაობს

3. Service Client (lib/supabase/service.ts)
   - Server Actions-ში (admin ოპერაციები)
   - RLS-ს გვერდს უვლის!
   - მხოლოდ სერვერზე, ფრთხილად!
```

---

## 9. Supabase

### რა არის Supabase?

Supabase = **Firebase-ის ღია კოდის ალტერნატივა**, PostgreSQL-ზე დაფუძნებული.

```
Supabase გაძლევს:
├── PostgreSQL Database (მონაცემთა ბაზა)
├── Authentication (ავტორიზაცია)
├── Row Level Security (წვდომის კონტროლი DB დონეზე)
├── Realtime (რეალურ დროში მონაცემები)
├── Storage (ფაილების შენახვა)
└── Edge Functions (სერვერლეს ფუნქციები)
```

### RLS (Row Level Security)

**ეს არის Supabase-ის ყველაზე მნიშვნელოვანი ფიჩერი!**

RLS ნიშნავს რომ **მონაცემთა ბაზა თავად ამოწმებს** ვის რა მონაცემებზე აქვს წვდომა:

```sql
-- მაგალითი: თანამშრომელი ხედავს მხოლოდ საკუთარ ცვლებს
CREATE POLICY "Employees see own shifts" ON shifts
FOR SELECT
USING (assigned_to = auth.uid());

-- მენეჯერი ხედავს თავისი ჯგუფის ცვლებს
CREATE POLICY "Managers see group shifts" ON shifts
FOR SELECT
USING (
  group_id IN (
    SELECT id FROM groups WHERE manager_id = auth.uid()
  )
);
```

**რატომ არის ეს კარგი?** თუ ვინმემ API-ს გვერდი აუარა, ბაზა მაინც არ მისცემს სხვისი მონაცემების ნახვას.

### Supabase Query Syntax

```tsx
// SELECT
const { data, error } = await supabase
  .from('shifts')
  .select('*, shift_templates(*)')
  .eq('assigned_to', userId)
  .gte('date', weekStart)
  .lte('date', weekEnd)
  .order('date');

// INSERT
const { error } = await supabase
  .from('shift_swaps')
  .insert({
    shift_id: shiftId,
    from_user_id: userId,
    type: 'direct',
    status: 'pending_employee',
  });

// UPDATE
const { error } = await supabase
  .from('shifts')
  .update({ assigned_to: newUserId })
  .eq('id', shiftId);

// DELETE
const { error } = await supabase
  .from('groups')
  .delete()
  .eq('id', groupId);
```

---

## 10. სტილიზაცია

### Tailwind CSS

**Angular-ში სტილები:**
```css
/* component.css */
.card {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

**Tailwind CSS-ში:**
```tsx
<div className="bg-white rounded-lg p-4 shadow-sm">
  Card content
</div>
```

**Tailwind-ის პრინციპი:** CSS კლასების ნაცვლად utility კლასებს წერ პირდაპირ HTML-ში.

#### ხშირი Tailwind კლასები

```
Layout:
  flex, grid, block, hidden
  items-center, justify-between
  gap-2, gap-4

Spacing:
  p-4 (padding: 16px)
  px-6 (padding-left + right: 24px)
  m-2 (margin: 8px)
  mt-4 (margin-top: 16px)

Typography:
  text-sm, text-lg, text-2xl
  font-bold, font-medium
  text-gray-500, text-primary

Colors:
  bg-white, bg-gray-100
  text-red-500, text-green-600
  border-gray-200

Borders:
  rounded-md, rounded-lg, rounded-full
  border, border-2
  shadow-sm, shadow-md

Responsive:
  sm: (640px+)
  md: (768px+)
  lg: (1024px+)
  xl: (1280px+)

  მაგ: "hidden md:block" = მობაილზე დამალული, tablet+ ზე ჩანს

Dark Mode:
  dark:bg-gray-900
  dark:text-white
```

### Shadcn/ui

Shadcn/ui = **კოპირებადი UI კომპონენტები** (არა npm პაკეტი!).

კომპონენტები `components/ui/` ფოლდერშია და **შენია** — შეგიძლია შეცვალო:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>სათაური</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="ძებნა..." />
        <Button variant="outline">ღილაკი</Button>
        <Badge variant="secondary">სტატუსი</Badge>
      </CardContent>
    </Card>
  );
}
```

### Dark Mode

პროექტში dark mode `next-themes` ბიბლიოთეკით არის იმპლემენტირებული:

```tsx
// components/providers.tsx
import { ThemeProvider } from "next-themes";

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      {children}
    </ThemeProvider>
  );
}
```

Tailwind-ში `dark:` prefix-ით:
```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
```

---

## 11. State Management

### Angular vs Next.js მიდგომა

**Angular-ში:**
```
Services + RxJS + NgRx/Store
├── Global State: NgRx Store ან Service Singleton
├── API Calls: HttpClient + Observables
├── Caching: NgRx Effects / Service cache
└── Real-time: WebSocket + RxJS
```

**Next.js-ში (ShiftFlow):**
```
Server Components + Server Actions + URL State
├── Global State: არ არის საჭირო! Server Components ჩატვირთავს ყოველ ჯერზე
├── API Calls: Server Components-ში პირდაპირი DB query
├── Caching: Next.js ჩაშენებული cache
├── Local State: useState Client Components-ში
└── URL State: searchParams (მაგ: ?week=2024-01-15)
```

**რატომ არ სჭირდება NgRx/Redux?**

Server Components-ში მონაცემები **ყოველ request-ზე** თავიდან ჩაიტვირთება. არ არის საჭირო client-side cache:

```tsx
// ეს Server Component ყოველ ჯერზე fresh data-ს ჩატვირთავს
export default async function EmployeePage() {
  const shifts = await getShifts(); // პირდაპირ DB-დან
  return <ShiftList shifts={shifts} />;
}
```

### URL State

```tsx
// URL: /employee?week=2024-01-15

export default async function EmployeePage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const weekStart = searchParams.week || getCurrentWeek();
  const shifts = await getShifts(weekStart);

  return <MyScheduleClient shifts={shifts} currentWeek={weekStart} />;
}
```

**Angular-ის AnalogI:**
```typescript
this.route.queryParams.subscribe(params => {
  this.week = params['week'];
});
```

---

## 12. TypeScript

### პროექტის ტიპები

ShiftFlow-ში ტიპები Supabase-დან ავტომატურად გენერირდება:

```tsx
// lib/types/database.types.ts (ავტო-გენერირებული)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          role: 'owner' | 'manager' | 'employee';
          company_id: string;
          is_active: boolean;
          must_change_password: boolean;
          created_at: string;
        };
        Insert: { /* ... */ };
        Update: { /* ... */ };
      };
      shifts: { /* ... */ };
      // ...
    };
  };
};
```

### ტიპების გამოყენება

```tsx
// lib/types/index.ts
import { Database } from './database.types';

// Row ტიპები (DB-დან წაკითხული)
export type UserProfile = Database['public']['Tables']['users']['Row'];
export type Shift = Database['public']['Tables']['shifts']['Row'];
export type Group = Database['public']['Tables']['groups']['Row'];

// Joined ტიპები
export type ShiftWithUser = Shift & {
  users: UserProfile;
  shift_templates: ShiftTemplate | null;
};

// Insert ტიპები (DB-ში ჩასაწერი)
export type ShiftInsert = Database['public']['Tables']['shifts']['Insert'];
```

---

## 13. პრაქტიკული მაგალითები პროექტიდან

### მაგალითი 1: გვერდი მონაცემებით (Server Component)

```tsx
// app/(dashboard)/manager/employees/page.tsx
import { createClient } from '@/lib/supabase/server';
import { EmployeesTable } from '@/components/manager/employees-table';

export default async function EmployeesPage() {
  const supabase = await createClient();

  // 1. მიმდინარე მომხმარებლის მიღება
  const { data: { user } } = await supabase.auth.getUser();

  // 2. თანამშრომლების ჩატვირთვა
  const { data: employees } = await supabase
    .from('users')
    .select('*, group_members(groups(*))')
    .eq('created_by', user!.id)
    .eq('role', 'employee')
    .order('created_at', { ascending: false });

  // 3. Client Component-ს გადაცემა
  return <EmployeesTable employees={employees || []} />;
}
```

### მაგალითი 2: ინტერაქტიული კომპონენტი (Client Component)

```tsx
// components/manager/create-group-dialog.tsx
"use client";

import { useState, useTransition } from 'react';
import { createGroup } from '@/app/actions/manager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      try {
        await createGroup(name);  // Server Action გამოძახება
        toast.success('ჯგუფი შეიქმნა!');
        setOpen(false);
        setName('');
      } catch (err) {
        toast.error('შეცდომა!');
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>ჯგუფის დამატება</Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">ახალი ჯგუფი</h2>

            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ჯგუფის სახელი"
            />

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                გაუქმება
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? 'იქმნება...' : 'შექმნა'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### მაგალითი 3: Server Action

```tsx
// app/actions/manager.ts
"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createGroup(name: string) {
  const supabase = await createClient();

  // ავტორიზაციის შემოწმება
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // მომხმარებლის პროფილი
  const { data: profile } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'manager') throw new Error('Forbidden');

  // ჯგუფის შექმნა
  const { error } = await supabase
    .from('groups')
    .insert({
      name,
      company_id: profile.company_id,
      manager_id: user.id,
    });

  if (error) throw new Error(error.message);

  // გვერდის განახლება (cache invalidation)
  revalidatePath('/manager/groups');
}
```

### მაგალითი 4: Layout

```tsx
// app/(dashboard)/layout.tsx
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single();

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar user={profile} />
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden">
        <MobileNav user={profile} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {children}  {/* <-- აქ ჩაიტვირთება page.tsx */}
      </main>
    </div>
  );
}
```

---

## 14. Angular vs React/Next.js - შედარების ცხრილი

### კონცეფციები

| კონცეფცია | Angular | React/Next.js |
|---|---|---|
| კომპონენტი | Class + Decorator | ფუნქცია |
| Template | HTML file | JSX (JS-ში) |
| სტილები | CSS/SCSS file | Tailwind classes / CSS Modules |
| Input | `@Input()` | Props |
| Output | `@Output() + EventEmitter` | Callback props |
| Two-way binding | `[(ngModel)]` | `value` + `onChange` |
| State | Class property | `useState` hook |
| Lifecycle | `ngOnInit`, `ngOnDestroy` | `useEffect` |
| DI | Services + Providers | Context / Props / Server |
| Routing | RouterModule | File-based (App Router) |
| Route Guard | CanActivate | middleware.ts |
| Lazy Loading | `loadChildren` | ავტომატური (App Router) |
| HTTP Client | HttpClient | fetch / Server Components |
| Pipes | Transform pipes | ჩვეულებრივი ფუნქციები |
| Directives | `*ngIf`, `*ngFor` | JS ლოგიკა (`&&`, `.map()`) |
| Modules | NgModule | არ არის (ფაილ-ბაზირებული) |
| Forms | Reactive Forms / Template Forms | `useState` + `onChange` |
| State Management | NgRx / Services | Server Components / useState |
| SSR | Angular Universal | ჩაშენებული (Server Components) |
| CLI | `ng generate`, `ng serve` | `npx create-next-app`, `npm run dev` |

### ფაილების სტრუქტურა

| Angular | Next.js | განმარტება |
|---|---|---|
| `app.module.ts` | არ არის | Module სისტემა არ არსებობს |
| `app.component.ts` | `app/layout.tsx` | Root component |
| `app-routing.module.ts` | `app/` folder structure | Routes |
| `*.component.ts` | `*.tsx` | Component |
| `*.component.html` | JSX (იგივე ფაილში) | Template |
| `*.component.css` | Tailwind classes | Styles |
| `*.service.ts` | `app/actions/*.ts` | Business logic |
| `*.guard.ts` | `middleware.ts` | Route protection |
| `*.resolver.ts` | Server Component (async) | Data pre-loading |
| `*.interceptor.ts` | middleware.ts | HTTP interception |
| `*.pipe.ts` | ჩვეულებრივი ფუნქცია | Data transformation |
| `*.directive.ts` | არ არის | (JSX-ში JS ლოგიკა) |
| `environment.ts` | `.env.local` | Environment variables |

### მენტალური მოდელი

```
Angular-ში ფიქრობ:
  "რომელ მოდულში ჩავამატო?"
  "რომელი სერვისი დავაინჯექთო?"
  "Observable-ს subscribe უნდა გავუკეთო"

React/Next.js-ში ფიქრობ:
  "Server-ზე უნდა თუ Client-ზე?"
  "Props-ით გადავცე თუ Server Action-ით?"
  "useState/useEffect საჭიროა?"
```

---

## 15. ხშირად დაშვებული შეცდომები

### 1. "use client" ყველგან

```tsx
// ❌ არასწორი - არ დაწერო "use client" ყველგან!
"use client";
export default function StaticPage() {
  return <h1>სტატიკური გვერდი</h1>;
}

// ✅ სწორი - მხოლოდ ინტერაქტიულ კომპონენტებში
export default function StaticPage() {
  return <h1>სტატიკური გვერდი</h1>;
}
```

### 2. State-ის პირდაპირი მუტაცია

```tsx
// ❌ არასწორი
const [items, setItems] = useState([1, 2, 3]);
items.push(4); // მუტაცია! UI არ განახლდება!

// ✅ სწორი
setItems([...items, 4]); // ახალი მასივი
```

### 3. useEffect-ში dependency-ების გამოტოვება

```tsx
// ❌ არასწორი - userId შეიცვლება და effect არ გაეშვება
useEffect(() => {
  fetchUser(userId);
}, []);

// ✅ სწორი
useEffect(() => {
  fetchUser(userId);
}, [userId]); // userId dependency-ში
```

### 4. Server Component-ში useState

```tsx
// ❌ არასწორი - Server Component-ში hooks არ მუშაობს!
export default async function Page() {
  const [count, setCount] = useState(0); // ERROR!
  return <div>{count}</div>;
}

// ✅ სწორი - გამოიყენე Client Component
"use client";
export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### 5. Client Component-ში async

```tsx
// ❌ არასწორი - Client Component async ვერ იქნება
"use client";
export default async function MyComponent() { // ERROR!
  const data = await fetch('...');
}

// ✅ სწორი - useEffect-ით ან Server Component-ით
"use client";
export default function MyComponent() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('...').then(r => r.json()).then(setData);
  }, []);
}
```

### 6. key-ის გამოტოვება map-ში

```tsx
// ❌ არასწორი
{items.map(item => <li>{item.name}</li>)}

// ✅ სწორი
{items.map(item => <li key={item.id}>{item.name}</li>)}
```

---

## 16. რჩევები და ბესთ პრაქტიკები

### სწრაფი დაწყება

1. **გაუშვი პროექტი:** `npm run dev` → `http://localhost:3000`
2. **შეცვალე page.tsx** → ბრაუზერში ავტომატურად განახლდება
3. **წაიკითხე `app/` ფოლდერი** → ეს არის შენი routing
4. **წაიკითხე `components/`** → ეს არის შენი UI

### ფაილის შექმნა

```
ახალი გვერდი?
  → app/(dashboard)/manager/new-page/page.tsx

ახალი კომპონენტი?
  → components/manager/my-component.tsx

ახალი Server Action?
  → app/actions/my-actions.ts ("use server")

ახალი API Route?
  → app/api/my-endpoint/route.ts
```

### კომპონენტის შექმნის ნაბიჯები

```
1. გადაწყვიტე: Server თუ Client?
   - მონაცემების ჩვენება → Server
   - ინტერაქცია (click, form) → Client ("use client")

2. ფუნქცია შექმნა → Props ტიპიზაცია → JSX return

3. ექსპორტი → import სხვა ფაილში
```

### Debug-ის რჩევები

```
Server Component-ის debug:
  - console.log() → ტერმინალში დაიწერება (არა ბრაუზერში!)
  - სერვერის ლოგები npm run dev-ში ჩანს

Client Component-ის debug:
  - console.log() → ბრაუზერის DevTools-ში
  - React DevTools extension დააინსტალირე

მონაცემთა ბაზა:
  - Supabase Dashboard → SQL Editor ან Table Editor
  - RLS policy-ების ტესტირება Dashboard-ში
```

### Import Alias

პროექტში `@/` = root folder:

```tsx
// ნაცვლად ამისა:
import { Button } from '../../../components/ui/button';

// გამოიყენე:
import { Button } from '@/components/ui/button';
```

### რესურსები

```
React:
  - https://react.dev (ოფიციალური)
  - https://react.dev/learn (ინტერაქტიული tutorial)

Next.js:
  - https://nextjs.org/docs (ოფიციალური)
  - https://nextjs.org/learn (სასწავლო)

Tailwind CSS:
  - https://tailwindcss.com/docs

Supabase:
  - https://supabase.com/docs

Shadcn/ui:
  - https://ui.shadcn.com
```

---

## მოკლე შეჯამება

```
Angular-დან Next.js-ზე გადასვლის 5 მთავარი ცვლილება:

1. Module სისტემის ნაცვლად → ფაილ-ბაზირებული სტრუქტურა
2. Services + DI ნაცვლად → Server Components + Server Actions
3. Template HTML ნაცვლად → JSX (JavaScript-ში)
4. RxJS/Observables ნაცვლად → async/await + useState
5. Route Guards ნაცვლად → middleware.ts

ყველაზე მნიშვნელოვანი:
- Server Component = მონაცემების ჩატვირთვა (resolver + component ერთში)
- Client Component = ინტერაქცია (useState, onClick)
- Server Action = backend ლოგიკა (service.ts)
- middleware.ts = route protection (guard)
```
