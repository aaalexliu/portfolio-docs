---
name: "Architecture: Front End"
route: /margins/front-end
menu: Margins 
---

# Architecture: Front End

### [(Github Link)](https://github.com/alexliusq/margins-me-frontend)
## Why Apollo, not Relay (and why a GraphQL Client)

A GraphQL endpoint works like an HTTP endpoint, so you can `fetch` to query the endpoint from your app. However, with a GraphQL client, you get a critical performance booster, client-side caching, and the two big ones are Apollo and Relay.s

I really wanted to use Relay. As a newcomer, I wanted to use an opinionated client to [fall into the pit of success](https://blog.codinghorror.com/falling-into-the-pit-of-success/). Also if it works for Facebook, it should work for me. Relay provided key benefits, such as:

- **Pre-compiled GraphQL queries:** Makes your resulting app bundle smaller, removes runtime demands, and allows for fancy features like allow-list queries, in which the server only responds to a pre-defined set of queries, improving security.
- **Query Aggregation:** Relay consolidates and de-duplicates queries into one network request
- **Latest UI Best Practices:** Relay and React both being developed by Facebook helps Relay support the latest and greatest in React, such as [Suspense for Data Fetching](https://reactjs.org/docs/concurrent-mode-suspense.html). Apollo, sadly, still [doesn't support Suspense in V3.](https://github.com/apollographql/apollo-feature-requests/issues/162)

However, Relay's community and developer support is... patchy at best. I tried out Relay's own [Step By Step Guide](https://relay.dev/docs/en/experimental/step-by-step) and found out that it was [broken since December 2019](https://github.com/relayjs/relay-examples/issues/130). That red flag, sparse stackoverflow answers/github issue comments, and [Artsy's Why Relay](https://artsy.github.io/blog/2019/04/10/omakase-relay/) post, convinced me that as a newcomer I would best be served by Apollo:

> It's worth highlighting the core difference in community engagement for Apollo vs Relay. Engineers working on Apollo have great incentives to do user support, and improve the tools for the community - that's their businesses value. Relay on the other hand is used in many places at Facebook, and the engineers on the team support internal issues first. IMO, this is reasonable: Relay is an opinionated batteries-included framework for building user interfaces, and ensuring it works with the baffling amount of JavaScript at Facebook is more or less all the team has time for.

Ever though Apollo has the incentives to be more developer friendly, it's definitely not a flawless learning experience. For example, as of December 20, 2020, Apollo's full stack tutorial still hasn't been updated for Apollo Client V3, and so later parts of the tutorial are broken – [Github Issue Link](https://github.com/apollographql/fullstack-tutorial/issues/161). However, their plentiful blog posts, examples, documentation, and best practice guides were more than good enough for me. 

## Apollo as a State Management + Data Fetching Solution (vs. Redux)

Redux has become the de facto state management library, I've tried it out, and I like how it forces you to think and organize state management in a clean, functional manner. However, at this point in my app's development, Redux is likely overkill. Right now, I use Apollo to cache data and Apollo's [Reactive Variables](https://www.apollographql.com/docs/react/local-state/reactive-variables/) to handle a few global state variables like `isLoggedIn`. As a [Redux maintainer himself notes:](https://changelog.com/posts/when-and-when-not-to-reach-for-redux)

> Similarly, if the only thing you were doing with Redux was storing cache data from the server, and you choose to use GraphQL and you choose to use Apollo Client, then you’ve just fulfilled the use case that you were previously choosing to use Redux for, and for that situation you don’t need Redux.

Furthermore, the use cases that [Dan Abramov lists](https://medium.com/@dan_abramov/you-might-not-need-redux-be46360cf367) for Redux seem to revolve primarily around fully modularizing state and providing powerful inspection and control mechanisms. 'Time-travel' through state history is especially cool. However, since I don't have complex data management needs or lots of client-side logic, these features are a nice-to-have, and currently not worth the development cost. 

As this [Apollo post on state management](https://www.apollographql.com/blog/dispatch-this-using-apollo-client-3-as-a-state-management-solution/) shows, Apollo and Redux both cover the core needs for client-side state management, but differ on they solve these problems.

**Redux**

- Storage: Plain JS object
- Updating state: actions + reducers
- Reactivity: Connect

**Apollo Client**

- Storage: Normalized cache
- Updating state: Cache APIs
- Reactivity: (Auto) Broadcast change notifications to Queries

The difference Apollo sells the most is its normalized cache, and it's a nice feature, but in my personal experience, one of the most painful too. Nice, because it automatically splits results into individual objects, assigns a unique identifier to each object, and stores them in a flattened data structure.[^1] This really helps with optimizing the cache and increasing the hit rate. Painful, because the documentation and guides on the cache API are opaque and scattered, which makes editing the cache a process of trial and error. Moreover, inspecting the cache is often a hit ore miss, because Apollo DevTools often requires multiple tries to load. Leaves a lot to be desired compared to Redux DevTools.

Hands down, the best experience I've had with Apollo is with its fetching features. I haven't run into any major issues with their two main react hooks, `useQuery` and `useMutation`, and they provide a lot of solutions that don't come with Redux:[^2]

> - Fetch logic
- Retry-logic
- Representing async logic (loading, failure, success, error states)
- Normalizing data
- Marshaling request and response data
- Facilitating optimistic UI updates

Overall, my usage of Apollo has been a decent experience, but the real star of the show is their developer relations. So many detailed, comprehensive, and informative posts on client side architecture and best practices. [Khalil Stemmler's Best Practices Series](https://www.apollographql.com/blog/introducing-the-apollo-client-best-practices-series/) is a standout.

## TypeScript + GraphQL Code Generator

Dynamic typing is wonderful and free-flowing until your code crashes during runtime. For me, strong typing and failing at compile-time has been an absolute life-saver and has improved my developer experience by an order of magnitude. 

After converting a microservice into TypeScript and creating interface after interface until all ESLint errors were fixed, I wasn’t exactly looking to manually recreating all the type definitions, and then manually synchronizing the types every time I changed the query or fragment. Enter GraphQL Codegen. It retrieves the GraphQL schema from my endpoint, parses it, and then programmatically generates all the necessary type definitions I need.

**This means that now my GraphQL schema, and by extension, my PostgreSQL schema can serve as a single source of truth for all my types.** Since my GraphQL schema is programmatically generated from my PostgreSQL database using PostGraphile, to persist a new feature, I just alter or add a table, and can automatically generate type definitions for my frontend. 

There's a rich plugin ecosystem that supports a variety of input formats. Right now I'm mainly using `typed-document-node` because it pre-compiles each GraphQL operation, giving me automatic type inference, auto-complete, and type checking with one import of a `TypedDocumentNode`. Here's a quick video demonstration, explainer from GraphQL Codegen developers [here](https://the-guild.dev/blog/typed-document-node).

[https://thumbs.gfycat.com/JoyfulAbleAsianwaterbuffalo-mobile.mp4](https://thumbs.gfycat.com/JoyfulAbleAsianwaterbuffalo-mobile.mp4)

I also used [TypeScript GraphQL-Request](https://graphql-code-generator.com/docs/plugins/typescript-graphql-request) to generate a lightweight, fully-typed, ready to use GraphQL client SDK. This was a Data Mapper utility library which converted the note objects returned from my Kindle email parser into a GraphQL mutation, and also turned out to be helpful in testing my GraphQL endpoint. 

Now, every query or mutation I write, or any object-destructuring of the response, **works the first time.** An absolutely monumental improvement in experience and productivity, and this alone made refactoring my entire app into TypeScript worth it. 

## Why Gatsby (vs. Next.js)?

My SPA was built at first using `create-react-app`, but after researching best practices for landing pages, I decided to adopt a modern JAMStack approach. At its core, JAMStack architecture is about pre-rending and deploying your site to a global CDN, which makes any static page blazing fast and SEO-friendly, and also eliminating the need to run servers to dynamically generate content (It also helps that the people who named this concept work at Netlify, which makes money by hosting websites and offering serverless functions). This meant choosing between the two of the biggest JAMstack frameworks, Gatsby and Next.js. Both offer optimizations that make your site blazing fast out-of-the-box, like:

- Pre-fetching of linked pages
- Code-splitting
- Image optimizations

Previously, Next was known for SSR (Server Side Rendering) and Gatsby was known for SSG (Static Site Generation). However, with Next.js 9.3, Next added a SSG that rivaled Gatsby's, and diminished the typical split between Gatsby for sites that were less dynamic (more page changes means more pages to build) and Next for sites that needed the boost from dynamic server side generation, like an e-commerce site that has thousands of constantly changing items.

The dealbreaker for Next.js, however, was its poor support for SPAs. With Next's routing system, all shared state and layout must be put in a custom, top-level `_app.tsx` component. Persisting layout [means custom, hacky solutions](https://adamwathan.me/2019/10/17/persistent-layout-patterns-in-nextjs/), and adding a client-side routing library in Next [is also rather painful](https://colinhacks.com/essays/building-a-spa-with-nextjs). Gatsby, on the other hand, uses and exposes `@reach/router`, so I could isolate my SPA's routing and layout completely from the rest of my Gatsby site. Thanks to this decoupling, it only took a day to wrap my CRA (`create-react-app`) within Gatsby and serve it from an `/app` route.

Gatsby also has an enormous library of high-quality plugins and themes that helped me instantly add useful features like SEO support and also get a full blown markdown-based blog.

However, Gatsby also has its pain points. TypeScript support is rather bare bones, requiring custom configuration. Gatsby's opinionated use of GraphQL to access data might not be for everybody. The biggest headache for me was that Gatsby's GraphQL queries did not play well at all with GraphQL Codegen, [an issue that other developers are still experiencing](https://github.com/dotansimha/graphql-code-generator/issues/5024), and I decided to just isolate codegen to my react app. 

Nonetheless I plan on picking up Next.js in the future, client-server codesharing is very cool, and their rate of improvement is impressive.

[^1]: [https://www.apollographql.com/blog/demystifying-cache-normalization/](https://www.apollographql.com/blog/demystifying-cache-normalization/)

[^2]: [https://www.apollographql.com/blog/dispatch-this-using-apollo-client-3-as-a-state-management-solution/](https://www.apollographql.com/blog/dispatch-this-using-apollo-client-3-as-a-state-management-solution/)