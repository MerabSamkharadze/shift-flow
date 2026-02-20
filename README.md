<a href="https://demo-nextjs-with-supabase.vercel.app/">
  <img alt="Next.js and Supabase Starter Kit - the fastest way to build apps with Next.js and Supabase" src="https://demo-nextjs-with-supabase.vercel.app/opengraph-image.png">
  <h1 align="center">Next.js and Supabase Starter Kit</h1>
</a>

<p align="center">
 The fastest way to build apps with Next.js and Supabase
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a>
  <a href="#more-supabase-examples"><strong>More Examples</strong></a>
</p>
<br/>

## Features

- Works across the entire [Next.js](https://nextjs.org) stack
  - App Router
  - Pages Router
  - Proxy
  - Client
  - Server
  - It just works!
- supabase-ssr. A package to configure Supabase Auth to use cookies
- Password-based authentication block installed via the [Supabase UI Library](https://supabase.com/ui/docs/nextjs/password-based-auth)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Components with [shadcn/ui](https://ui.shadcn.com/)
- Optional deployment with [Supabase Vercel Integration and Vercel deploy](#deploy-your-own)
  - Environment variables automatically assigned to Vercel project

## Demo

You can view a fully working demo at [demo-nextjs-with-supabase.vercel.app](https://demo-nextjs-with-supabase.vercel.app/).

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).

## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Create a Next.js app using the Supabase Starter template npx command

   ```bash
   npx create-next-app --example with-supabase with-supabase-app
   ```

   ```bash
   yarn create next-app --example with-supabase with-supabase-app
   ```

   ```bash
   pnpm create next-app --example with-supabase with-supabase-app
   ```

3. Use `cd` to change into the app's directory

   ```bash
   cd with-supabase-app
   ```

4. Rename `.env.example` to `.env.local` and update the following:

  ```env
  NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[INSERT SUPABASE PROJECT API PUBLISHABLE OR ANON KEY]
  ```
  > [!NOTE]
  > This example uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, which refers to Supabase's new **publishable** key format.
  > Both legacy **anon** keys and new **publishable** keys can be used with this variable name during the transition period. Supabase's dashboard may show `NEXT_PUBLIC_SUPABASE_ANON_KEY`; its value can be used in this example.
  > See the [full announcement](https://github.com/orgs/supabase/discussions/29260) for more information.

  Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` can be found in [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true)

5. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [localhost:3000](http://localhost:3000/).

6. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.

## Feedback and issues

Please file feedback and issues over on the [Supabase GitHub org](https://github.com/supabase/supabase/issues/new/choose).

## More Supabase examples

- [Next.js Subscription Payments Starter](https://github.com/vercel/nextjs-subscription-payments)
- [Cookie-based Auth and the Next.js 13 App Router (free course)](https://youtube.com/playlist?list=PL5S4mPUpp4OtMhpnp93EFSo42iQ40XjbF)
- [Supabase Auth and the Next.js App Router](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)
# shift-flow

Database Schema - დეტალური აღწერა
1️⃣ companies - კომპანიების ცხრილი
ეს არის ყველაზე მაღალი დონის ცხრილი. თითოეული კომპანია
სრულიად იზოლირებულია სხვა კომპანიებისგან.

ველები:
├─ id (UUID, Primary Key)
│   └─ უნიკალური იდენტიფიკატორი თითოეული კომპანიისთვის
│
├─ name (TEXT, NOT NULL)
│   └─ კომპანიის სახელი (მაგ: "რესტორანი არაგვი")
│
├─ created_at (TIMESTAMP)
│   └─ კომპანიის რეგისტრაციის თარიღი
│
└─ settings (JSONB, NULLABLE)
└─ დამატებითი პარამეტრები მომავალში:
• timezone
• working_days (ორშაბათი-კვირა)
• notification preferences

2️⃣ users - ყველა მომხმარებლის ცხრილი
ამ ცხრილში ინახება: Company Owners, Managers, Employees
როლი განისაზღვრება 'role' ველით.

ველები:
├─ id (UUID, Primary Key)
│   └─ Supabase Auth-ის user ID (auth.users-თან დაკავშირებული)
│
├─ company_id (UUID, Foreign Key → companies.id)
│   └─ რომელ კომპანიას ეკუთვნის ეს მომხმარებელი
│   └─ INDEX: ძალიან ხშირად ვეძებთ company_id-ით
│
├─ role (TEXT, NOT NULL)
│   └─ შესაძლო მნიშვნელობები:
│       • 'owner' - Company Owner (ერთი კომპანიაში ერთი)
│       • 'manager' - მენეჯერი (კომპანიაში შეიძლება რამდენიმე)
│       • 'employee' - თანამშრომელი
│
├─ email (TEXT, UNIQUE, NOT NULL)
│   └─ ავტორიზაციისთვის და ნოტიფიკაციებისთვის
│
├─ first_name (TEXT)
│   └─ სახელი
│
├─ last_name (TEXT)
│   └─ გვარი
│
├─ phone (TEXT, NULLABLE)
│   └─ ტელეფონის ნომერი (SMS ნოტიფიკაციებისთვის)
│
├─ must_change_password (BOOLEAN, DEFAULT true)
│   └─ ახალი თანამშრომლების პირველ შესვლაზე აიძულებენ
│       პაროლის შეცვლას
│
├─ created_by (UUID, Foreign Key → users.id, NULLABLE)
│   └─ ვინ შექმნა ეს user
│   └─ Owner-ს NULL აქვს (ჩვენ ხელით ვქმნით)
│   └─ Manager-ს → Owner-ის ID
│   └─ Employee-ს → Manager-ის ID
│
├─ is_active (BOOLEAN, DEFAULT true)
│   └─ წაშლის ნაცვლად ვაკეთებთ inactive
│   └─ წაშლილი თანამშრომლები არ ჩანან, მაგრამ
│       ისტორიული მონაცემები რჩება
│
└─ created_at (TIMESTAMP)
└─ შექმნის თარიღი
მნიშვნელოვანი ლოგიკა:

Owner-ს ჩვენ ვქმნით ხელით admin panel-იდან
Owner ამატებს Manager-ებს პლატფორმიდან
Manager ამატებს Employee-ებს პლატფორმიდან


3️⃣ groups - თანამშრომლების ჯგუფები (departments)
თითოეული Manager ქმნის საკუთარ ჯგუფებს და მხოლოდ მათ
მართავს. სხვა Manager-ების ჯგუფები მას არ ეხება.

ველები:
├─ id (UUID, Primary Key)
│
├─ company_id (UUID, Foreign Key → companies.id)
│   └─ რომელ კომპანიას ეკუთვნის ეს ჯგუფი
│   └─ INDEX: company_id
│
├─ manager_id (UUID, Foreign Key → users.id)
│   └─ ვინ შექმნა და მართავს ამ ჯგუფს
│   └─ INDEX: manager_id (ხშირად ვეძებთ manager-ის ჯგუფებს)
│   └─ RLS: Manager მხოლოდ საკუთარ ჯგუფებს ხედავს
│
├─ name (TEXT, NOT NULL)
│   └─ ჯგუფის სახელი (მაგ: "მზარეულები", "ბარმენები")
│
├─ color (TEXT, NULLABLE)
│   └─ HEX color code UI-სთვის (#FF5733)
│   └─ ცხრილში ვიზუალური განსხვავებისთვის
│
├─ is_active (BOOLEAN, DEFAULT true)
│   └─ წაშლის ნაცვლად deactivate
│
└─ created_at (TIMESTAMP)
მნიშვნელოვანი:

Manager A-ს ჯგუფები Manager B-მ ვერ ნახავს
ერთ კომპანიაში შეიძლება იყოს:

Manager 1 → "მზარეულები", "დამლაგებლები"
Manager 2 → "ბარმენები", "მიმტანები"




4️⃣ shift_templates - შიფტების შაბლონები ჯგუფისთვის
Manager თითოეული ჯგუფისთვის განსაზღვრავს შიფტების
შაბლონებს (მაგ: 08:00-16:00, 16:00-00:00, 00:00-08:00).

ველები:
├─ id (UUID, Primary Key)
│
├─ group_id (UUID, Foreign Key → groups.id)
│   └─ რომელ ჯგუფს ეკუთვნის ეს შიფტის შაბლონი
│   └─ INDEX: group_id
│
├─ name (TEXT, NOT NULL)
│   └─ შიფტის სახელი (მაგ: "დილის ცვლა", "ღამის ცვლა")
│
├─ start_time (TIME, NOT NULL)
│   └─ დაწყების დრო (მაგ: 08:00:00)
│
├─ end_time (TIME, NOT NULL)
│   └─ დამთავრების დრო (მაგ: 16:00:00)
│
├─ duration_hours (DECIMAL, GENERATED)
│   └─ ავტომატურად გამოთვლილი საათები
│   └─ GENERATED COLUMN: end_time - start_time
│
└─ created_at (TIMESTAMP)

მაგალითი მონაცემები:
┌─────────┬──────────┬────────────┬──────────┬──────────┐
│ group_id│   name   │ start_time │ end_time │ duration │
├─────────┼──────────┼────────────┼──────────┼──────────┤
│ group-1 │ დილის    │ 08:00:00   │ 16:00:00 │   8      │
│ group-1 │ საღამოს  │ 16:00:00   │ 00:00:00 │   8      │
│ group-1 │ ღამის    │ 00:00:00   │ 08:00:00 │   8      │
└─────────┴──────────┴────────────┴──────────┴──────────┘
ლოგიკა:

Manager ჯგუფის შექმნისას ამ შაბლონებს აყენებს
შემდეგ ცხრილის შედგენისას ამ შაბლონებს იყენებს
Manager-ს შეუძლია დროებით შეცვალოს კონკრეტული
თანამშრომლის შიფტი (მაგ: +2 საათი დაამატოს)


5️⃣ group_members - ჯგუფის წევრები (many-to-many)
აკავშირებს თანამშრომლებს ჯგუფებთან. ერთი თანამშრომელი
შეიძლება იყოს რამდენიმე ჯგუფში.

ველები:
├─ id (UUID, Primary Key)
│
├─ group_id (UUID, Foreign Key → groups.id)
│   └─ INDEX: group_id
│
├─ user_id (UUID, Foreign Key → users.id)
│   └─ INDEX: user_id
│   └─ CONSTRAINT: user უნდა იყოს role='employee'
│
├─ assigned_at (TIMESTAMP)
│   └─ როდის დაემატა ამ ჯგუფს
│
└─ UNIQUE (group_id, user_id)
└─ ერთი თანამშრომელი ერთ ჯგუფში ერთხელ

მაგალითი:
თანამშრომელი "გიორგი":
├─ group: "მზარეულები"
└─ group: "დამლაგებლები"

6️⃣ schedules - კვირეული ცხრილები
თითოეული კვირისთვის იქმნება ცალკე schedule record.
Manager-ს შეუძლია წინა კვირის ცხრილის კოპირება.

ველები:
├─ id (UUID, Primary Key)
│
├─ company_id (UUID, Foreign Key → companies.id)
│   └─ INDEX: company_id
│
├─ manager_id (UUID, Foreign Key → users.id)
│   └─ ვინ შექმნა ეს ცხრილი
│
├─ group_id (UUID, Foreign Key → groups.id)
│   └─ რომელი ჯგუფისთვისაა ეს ცხრილი
│   └─ INDEX: group_id
│
├─ week_start_date (DATE, NOT NULL)
│   └─ კვირის დაწყების თარიღი (ორშაბათი)
│   └─ INDEX: week_start_date
│
├─ week_end_date (DATE, NOT NULL)
│   └─ კვირის დასასრულის თარიღი (კვირა)
│
├─ status (TEXT, DEFAULT 'draft')
│   └─ შესაძლო მნიშვნელობები:
│       • 'draft' - მუშავდება
│       • 'published' - გამოქვეყნებული (თანამშრომლები ხედავენ)
│       • 'archived' - დასრულებული კვირა
│
├─ copied_from_schedule_id (UUID, Foreign Key → schedules.id)
│   └─ თუ კოპირებული იყო წინა კვირიდან, რომელი schedule-დან
│   └─ NULLABLE
│
└─ created_at (TIMESTAMP)

UNIQUE CONSTRAINT:
(group_id, week_start_date)
└─ ერთ ჯგუფს არ შეიძლება ჰქონდეს 2 ცხრილი ერთ კვირაზე
ლოგიკა:

Manager აკლიკებს "Create Schedule for Week of Jan 20-26"
პირველ კვირას ცარიელია, ხელით ავსებს
მეორე კვირაზე: "Copy from previous week" ღილაკი
თუ დააკოპირა → copied_from_schedule_id ივსება


7️⃣ shifts - კონკრეტული შიფტები
ეს არის ყველაზე მნიშვნელოვანი ცხრილი - აქ ინახება
თითოეული თანამშრომლის კონკრეტული სამუშაო ცვლები.

ველები:
├─ id (UUID, Primary Key)
│
├─ schedule_id (UUID, Foreign Key → schedules.id)
│   └─ რომელ კვირეულ ცხრილს ეკუთვნის
│   └─ INDEX: schedule_id
│
├─ group_id (UUID, Foreign Key → groups.id)
│   └─ რომელი ჯგუფისთვისაა
│
├─ assigned_to (UUID, Foreign Key → users.id)
│   └─ ვის აქვს მინიჭებული ეს შიფტი
│   └─ INDEX: assigned_to (ხშირად ვეძებთ user-ის shifts)
│
├─ date (DATE, NOT NULL)
│   └─ კონკრეტული თარიღი (2025-02-20)
│   └─ INDEX: date
│
├─ start_time (TIME, NOT NULL)
│   └─ დაწყების დრო
│
├─ end_time (TIME, NOT NULL)
│   └─ დამთავრების დრო
│
├─ shift_template_id (UUID, Foreign Key → shift_templates.id)
│   └─ NULLABLE - თუ შაბლონიდან შეიქმნა
│   └─ თუ Manager ხელით დაამატა +2 საათი, აღარ არის template
│
├─ status (TEXT, DEFAULT 'scheduled')
│   └─ შესაძლო მნიშვნელობები:
│       • 'scheduled' - დაგეგმილი
│       • 'completed' - დასრულებული
│       • 'cancelled' - გაუქმებული
│       • 'pending_swap' - გაცვლის პროცესშია
│
├─ notes (TEXT, NULLABLE)
│   └─ Manager-ის შენიშვნები კონკრეტულ შიფტზე
│
├─ created_by (UUID, Foreign Key → users.id)
│   └─ ვინ შექმნა (Manager)
│
├─ modified_by (UUID, Foreign Key → users.id)
│   └─ ბოლოს ვინ შეცვალა
│
├─ created_at (TIMESTAMP)
│
└─ updated_at (TIMESTAMP)
└─ ბოლო რედაქტირების დრო

INDEX: (assigned_to, date) - ხშირად ვეძებთ user-ის shifts
კონკრეტულ თარიღზე
მაგალითი მონაცემები:
ორშაბათი, 20 იანვარი 2025:
┌────────────┬───────────┬────────────┬──────────┬─────────┐
│assigned_to │   date    │ start_time │ end_time │  status │
├────────────┼───────────┼────────────┼──────────┼─────────┤
│ გიორგი     │ 2025-01-20│ 08:00:00   │ 16:00:00 │scheduled│
│ ნინო       │ 2025-01-20│ 16:00:00   │ 00:00:00 │scheduled│
│ დათო       │ 2025-01-20│ 00:00:00   │ 08:00:00 │scheduled│
└────────────┴───────────┴────────────┴──────────┴─────────┘

8️⃣ shift_swaps - შიფტების გაცვლის მოთხოვნები
თანამშრომლები ერთმანეთს უგზავნიან ან საჯაროდ აქვეყნებენ
შიფტებს გასაჩუქებლად.

ველები:
├─ id (UUID, Primary Key)
│
├─ shift_id (UUID, Foreign Key → shifts.id)
│   └─ რომელი შიფტი იცვლება
│   └─ INDEX: shift_id
│
├─ from_user_id (UUID, Foreign Key → users.id)
│   └─ ვინ აძლევს შიფტს
│
├─ to_user_id (UUID, Foreign Key → users.id, NULLABLE)
│   └─ ვის უგზავნის (პირდაპირი გაცვლა)
│   └─ NULL თუ საჯარო გაცვლაა
│
├─ type (TEXT, NOT NULL)
│   └─ შესაძლო მნიშვნელობები:
│       • 'direct' - პირდაპირ გაუგზავნა კონკრეტულ კოლეგას
│       • 'public' - საჯაროდ დადო გასაჩუქებლად
│
├─ status (TEXT, DEFAULT 'pending_employee')
│   └─ შესაძლო მნიშვნელობები:
│       • 'pending_employee' - ელოდება თანამშრომლის პასუხს
│       • 'accepted_by_employee' - თანამშრომელმა მიიღო
│       • 'pending_manager' - ელოდება მენეჯერის approve-ს
│       • 'approved' - მენეჯერმა დაამტკიცა (ცხრილი შეიცვალა!)
│       • 'rejected_by_employee' - თანამშრომელმა უარყო
│       • 'rejected_by_manager' - მენეჯერმა უარყო
│       • 'cancelled' - from_user-მა გააუქმა
│       • 'expired' - არ უპასუხა deadline-ში
│
├─ accepted_by (UUID, Foreign Key → users.id, NULLABLE)
│   └─ საჯარო გაცვლისას - ვინ მიიღო შიფტი
│   └─ პირდაპირ გაცვლისას - to_user_id-ს დუბლიკატი
│
├─ approved_by (UUID, Foreign Key → users.id, NULLABLE)
│   └─ რომელმა Manager-მა დაამტკიცა
│
├─ manager_notes (TEXT, NULLABLE)
│   └─ Manager-ის კომენტარი (თუ უარყო რატომ)
│
├─ requested_at (TIMESTAMP, DEFAULT NOW())
│   └─ როდის გააკეთა request
│
├─ employee_responded_at (TIMESTAMP, NULLABLE)
│   └─ როდის უპასუხა თანამშრომელმა
│
├─ manager_responded_at (TIMESTAMP, NULLABLE)
│   └─ როდის უპასუხა მენეჯერმა
│
├─ deadline (TIMESTAMP, GENERATED)
│   └─ shifts.date - 8 hours
│   └─ ავტომატური: შიფტამდე 8 საათით ადრე
│
└─ expires_at (TIMESTAMP, NULLABLE)
└─ თუ არ უპასუხა deadline-ში → auto-expire

INDEX: (shift_id, status) - swap requests-ს ძებნისთვის
INDEX: (from_user_id, status) - user-ის pending requests
INDEX: (to_user_id, status) - incoming requests
გაცვლის Flow:
Scenario 1: პირდაპირი გაცვლა
1. გიორგი → გზავნის shift-ს → ნინოს
   status: 'pending_employee'

2. ნინო → Accept
   status: 'accepted_by_employee' → 'pending_manager'

3. Manager → Approve
   status: 'approved'
   shifts.assigned_to: გიორგი → ნინო (ცხრილი შეიცვალა!)
   Scenario 2: საჯარო გაცვლა
1. გიორგი → აქვეყნებს shift-ს საჯაროდ
   type: 'public'
   to_user_id: NULL
   status: 'pending_employee'

2. დათო → პირველმა დააკლიკა "I'll take it"
   accepted_by: დათო
   status: 'accepted_by_employee' → 'pending_manager'

3. Manager → Approve
   status: 'approved'
   shifts.assigned_to: გიორგი → დათო

9️⃣ notifications - ნოტიფიკაციები
ყველა მნიშვნელოვანი მოვლენა (swap request, approve,
schedule change) აგენერირებს ნოტიფიკაციას.

ველები:
├─ id (UUID, Primary Key)
│
├─ user_id (UUID, Foreign Key → users.id)
│   └─ ვის ნოტიფიკაციაა
│   └─ INDEX: (user_id, read, created_at)
│
├─ type (TEXT, NOT NULL)
│   └─ შესაძლო ტიპები:
│       • 'swap_request_received' - შიფტი გამოგიგზავნეს
│       • 'swap_request_accepted' - თანამშრომელმა მიიღო
│       • 'swap_request_rejected' - უარყო
│       • 'swap_approved' - მენეჯერმა დაამტკიცა
│       • 'swap_rejected_by_manager' - მენეჯერმა უარყო
│       • 'public_swap_available' - საჯარო swap დაემატა
│       • 'schedule_changed' - ცხრილი შეიცვალა
│       • 'new_schedule_published' - ახალი კვირის ცხრილი
│
├─ title (TEXT, NOT NULL)
│   └─ ნოტიფიკაციის სათაური (UI-სთვის)
│
├─ message (TEXT, NOT NULL)
│   └─ სრული ტექსტი
│
├─ read (BOOLEAN, DEFAULT false)
│   └─ წაკითხულია თუ არა
│
├─ related_shift_id (UUID, Foreign Key → shifts.id, NULLABLE)
│   └─ დაკავშირებული შიფტი (თუ არის)
│
├─ related_swap_id (UUID, Foreign Key → shift_swaps.id, NULLABLE)
│   └─ დაკავშირებული swap request (თუ არის)
│
├─ action_url (TEXT, NULLABLE)
│   └─ სად უნდა გადავიდეს თუ დააკლიკებს
│   └─ მაგ: "/swaps/12345"
│
└─ created_at (TIMESTAMP)

INDEX: (user_id, read, created_at DESC)
└─ წასაკითხი ნოტიფიკაციების სწრაფად მოსაძებნად

🔟 activity_logs - აუდიტის ჟურნალი
ყველა მნიშვნელოვანი ქმედება ლოგდება (წაშლა, რედაქტირება,
approve). Manager-ს და Owner-ს დასჭირდება ისტორიის ნახვა.

ველები:
├─ id (UUID, Primary Key)
│
├─ company_id (UUID, Foreign Key → companies.id)
│   └─ INDEX: company_id
│
├─ user_id (UUID, Foreign Key → users.id)
│   └─ ვინ შეასრულა ქმედება
│
├─ action (TEXT, NOT NULL)
│   └─ რა ქმედება იყო:
│       • 'shift_created'
│       • 'shift_updated'
│       • 'shift_deleted'
│       • 'swap_approved'
│       • 'swap_rejected'
│       • 'employee_added'
│       • 'employee_deactivated'
│       • 'schedule_published'
│
├─ entity_type (TEXT)
│   └─ რა ობიექტზე: 'shift', 'user', 'schedule', 'swap'
│
├─ entity_id (UUID)
│   └─ კონკრეტული ობიექტის ID
│
├─ old_value (JSONB, NULLABLE)
│   └─ ძველი მნიშვნელობა (update-ის შემთხვევაში)
│
├─ new_value (JSONB, NULLABLE)
│   └─ ახალი მნიშვნელობა
│
├─ ip_address (TEXT, NULLABLE)
│   └─ უსაფრთხოებისთვის
│
└─ created_at (TIMESTAMP)

INDEX: (company_id, created_at DESC)
INDEX: (user_id, created_at DESC)
INDEX: (entity_type, entity_id, created_at DESC)

🔗 ურთიერთობები (Relationships)
companies
└── users (1:N)
├── groups (1:N) [manager_id]
│   ├── shift_templates (1:N)
│   ├── group_members (1:N)
│   │   └── users (N:1) [employees]
│   └── schedules (1:N)
│       └── shifts (1:N)
│           └── shift_swaps (1:N)
│               └── notifications (1:N)
└── activity_logs (1:N)

📐 მთავარი Indexes (Performance)
sql-- ყველაზე ხშირი queries:

1. "მენეჯერის ყველა ჯგუფი"
   INDEX: groups(manager_id, is_active)

2. "ჯგუფის ყველა თანამშრომელი"
   INDEX: group_members(group_id)

3. "თანამშრომლის ყველა შიფტი კონკრეტულ თარიღზე"
   INDEX: shifts(assigned_to, date)

4. "კვირის ცხრილი ჯგუფისთვის"
   INDEX: schedules(group_id, week_start_date)

5. "pending swap requests"
   INDEX: shift_swaps(to_user_id, status, deadline)

6. "წასაკითხი ნოტიფიკაციები"
   INDEX: notifications(user_id, read, created_at DESC)

მზადა ვარ შემდეგ ნაბიჯზე გადასვლისთვის!
რას ვაკეთებთ შემდეგ?

RLS Policies - Supabase უსაფრთხოების წესები
API Routes - Next.js endpoint-ების სტრუქტურა
User Flows - ვიზუალური დიაგრამები

