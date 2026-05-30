# Mission: Backend Persistence For Ecommerce

## Why
You are a frontend developer learning backend development by building a real ecommerce API. MongoDB, Mongoose, and an infrastructure layer matter because they are the first persistence boundary you need before users, products, orders, auth, payments, chat, schedulers, and future database adapters can be built cleanly.

## Success looks like
- You can explain what MongoDB stores, what Mongoose adds, and where schemas are enforced.
- You can design a Mongoose persistence adapter without leaking database details into business logic.
- You can add users, products, and orders with clear separation between API, application, domain, and infrastructure concerns.
- You can later swap or compare MongoDB with another database adapter, such as Postgres, without rewriting the core use cases.

## Constraints
- The learning project uses Node.js, Express, TypeScript, Mongoose, Docker, and Bruno.
- The first version should stay simple and practical, not over-engineered.
- Explanations should connect to this ecommerce codebase and use small exercises.

## Out of scope
- Advanced MongoDB scaling, sharding, replica set administration, and performance tuning until basic persistence is solid.
- Full event sourcing, CQRS, or complex DDD patterns until the simple layer boundaries are understood.
