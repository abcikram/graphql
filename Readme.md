Store refresh token in DB (secure)
Token rotation
Logout / logout-all
RBAC guards
Rate limiting



Don’t try to learn everything randomly.

👉 Focus on this combo:
Node.js + System Design + DevOps basics + One solid project

If you want, I can:

Create a daily study plan (2–3 hrs/day)
Take mock interviews
Review your project architecture like a senior engineer


eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDJhY2U1MThmOGI5Zjg3ODNkZTk4NiIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3NTUyMzEzMCwiZXhwIjoxNzc1NTI0MDMwfQ.SNsIW5BTCEEJN5QEoUM8_wjRHZdQoYQbwv-CDSbALSA



``
💥 N+1 Problem কী?

👉 যখন তুমি একটা list fetch করো, আর প্রতিটা item এর জন্য আলাদা DB query চালাও

🔴 Example (Problem)

ধরো তোমার query:

query {
  tasks {
    id
    title
    assignedTo {
      name
    }
  }
}
⚙️ Resolver (wrong way)
Task: {
  assignedTo: async (parent) => {
    return await UserModel.findById(parent.assignedTo);
  }
}
🔥 কী হবে?

ধরো DB তে 5টা task আছে:

1 query → tasks
5 query → user (each task)

Total = 6 queries ❌

👉 এটাকেই বলে N+1 problem

🚨 কেন এটা dangerous?
Performance slow ❌
DB load বেশি ❌
Scale করলে crash ❌
✅ Solution = DataLoader

👉 DataLoader batch + cache করে queries

🧠 Concept

Instead of:

user1 → DB
user2 → DB
user3 → DB

👉 DataLoader করবে:

[user1, user2, user3] → ONE DB query ✅
🚀 Implementation
1️⃣ Create DataLoader
// user.loader.ts

import DataLoader from "dataloader";
import { UserModel } from "./user.model";

export const createUserLoader = () =>
  new DataLoader(async (ids: readonly string[]) => {
    const users = await UserModel.find({
      _id: { $in: ids },
    });

    const map = new Map(users.map(u => [u._id.toString(), u]));

    return ids.map(id => map.get(id));
  });
2️⃣ Add to context
loaders: {
  userLoader: createUserLoader()
}

👉 IMPORTANT: per request create করতে হবে

3️⃣ Use in resolver
Task: {
  assignedTo: (parent, _, context) => {
    return context.loaders.userLoader.load(
      parent.assignedTo.toString()
    );
  }
}
🔥 এখন কী হবে?

ধরো 5টা task:

DataLoader collects:
[user1, user2, user3, user4, user5]

→ ONE DB query ✅
📊 Before vs After
Case	Queries
Without DataLoader	1 + N ❌
With DataLoader	2 ✅
🧠 Bonus: Caching
loader.load("user1")
loader.load("user1")

👉 Same request এ → only 1 DB call ✅

⚠️ Common Mistakes (VERY IMPORTANT)
❌ 1. Global DataLoader
const loader = createUserLoader(); // ❌ global

👉 Memory leak + wrong data

✅ Correct
context: {
  loaders: {
    userLoader: createUserLoader()
  }
}
❌ 2. Wrong return order
return users; // ❌ wrong

👉 must match input order

✅ Correct
return ids.map(id => map.get(id));
🎯 Interview Answer (Perfect)

👉 যদি জিজ্ঞেস করে:

"What is N+1 problem?"

তুমি বলবে:

N+1 problem occurs when fetching a list and then making additional queries for each item. DataLoader solves this by batching and caching database calls.

🔥 Real-Life Use

Use DataLoader for:

User inside Task ✅
Comments inside Post ✅
Orders inside User ✅

``


///++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



🧠 GraphQL এ parent কী?

👉 parent হলো আগের resolver যেটা return করেছে সেই data/object

🔥 সহজ উদাহরণ

ধরো তোমার schema:

type Task {
  id: ID!
  title: String!
  assignedTo: User!
}
Query
query {
  tasks {
    id
    title
    assignedTo {
      name
    }
  }
}
⚙️ কীভাবে flow চলে
1️⃣ প্রথমে tasks resolver চলবে
Query: {
  tasks: () => {
    return [
      {
        id: "1",
        title: "Task 1",
        assignedTo: "user123"
      }
    ];
  }
}

👉 এখানে parent = ❌ undefined (কারণ এটা root level)

2️⃣ তারপর Task.assignedTo resolver
Task: {
  assignedTo: (parent) => {
    console.log(parent);
  }
}

👉 এখানে parent কী?

{
  "id": "1",
  "title": "Task 1",
  "assignedTo": "user123"
}

👉 মানে আগের resolver (tasks) যেটা return করেছে সেই object

📌 সহজভাবে

👉 parent = আগের ধাপের result

🧠 তোমার code এ
Task: {
  assignedTo: (parent, _, context) => {
    return context.loaders.userLoader.load(
      parent.assignedTo.toString()
    );
  }
}

👉 এখানে:

parent.assignedTo

= userId (যেটা Task এর মধ্যে আছে)

🔥 Flow visualization
Query.tasks()
   ↓
Task[] return
   ↓
Task.assignedTo(parent = Task)
   ↓
User return
   ↓
User.name(parent = User)
⚠️ গুরুত্বপূর্ণ
❌ parent ≠ context
(parent, args, context)
parameter	মানে
parent	আগের data
args	input
context	global data (user, loaders)
❌ Root resolver এ parent থাকে না
Query: {
  tasks: (parent) => {
    console.log(parent); // undefined
  }
}
🎯 Interview answer (বাংলায়)

👉 যদি জিজ্ঞেস করে:

"parent কী?"

তুমি বলবে:

parent হলো আগের resolver যেটা return করেছে সেই data, যেটা next resolver ব্যবহার করে।

🚀 Pro Tip (important)

👉 অনেক সময় DB call avoid করতে পারো:

Task: {
  assignedTo: (parent) => parent.assignedUser
}

👉 মানে আগে থেকেই data attach করলে extra query লাগবে না