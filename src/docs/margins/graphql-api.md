---
name: "Architecture: GraphQL API"
route: /margins/graphql-api
menu: Margins 
---

# Architecture: GraphQL API

### [(Github Link)](https://github.com/alexliusq/margins-services/tree/master/graphql-api)

## Why Relational?

Benefits:

- **Schemas.** Most NoSQL databases argue that the rigidity of schemas create bottlenecks and delays and that their schema-less design offers developers flexibility and ease of use. However, for my use case, designing the schema upfront helped me think through and make explicit my app's data requirements. Moreover, DDL constraints provided assurances that fields would be not null or unique, enforcing consistency at the data level, not just the application level
- **Data Integrity**
    - **Referential Integrity.** Foreign Keys and ON CASCADE made sure that I didn't have to worry about a missing reference or an existing reference getting deleted.
    - **ACID guarantees.** Did I need to absolutely make sure that all my CRUD had the same security and guarantees as a banking transaction? Not really. But ACID and built-in features like serializability eliminates a whole class of data errors and race conditions.
- **Normalization and Joins.** Normalization helped eliminate redundancies, and JOINS helped turn my table into a graph (critical for GraphQL integration later on). Made it clear what I considered to be an 'entity', in relation to other entities, and make table/relation-level constraints.
- **Universal.** SQL has a huge, mature, powerful ecosystem. See the "SQL as the 'Narrow Waist' for Data Analysis" Section Below

Pain points, but not dealbreakers:

- **CAP.** For a small project, I don't have a Partition, yet, so no need to make a hard choice right now between Consistency and Availability
- **Object-relational impedance mismatch.** Trying to implement inheritance or parent-child hierarchies without breaking data integrity best practices was a massive headache, thankfully these problems have been tackled already in books in like *Patterns of Enterprise Application Architecture* and *SQL Antipatterns.* Ended up with a Class Table Inheritance Pattern, and learned how to identify and avoid multiple antipatterns.
- **Scaling**. Every blog post and stackoverflow post mentioned that relational databases have major problems in distributed systems and scaling horizontally. However, I plan to migrate to Amazon Aurora, and if Samsung and Doordash (featured customers) stuck with relational databases, then I think relational databases can work at scale.
- **Schemas.** PostgreSQL has a native JSON data type which mitigated the pain of variable data sources. Critically, this was a personal project, I had full control, and also a Dockerized PostreSQL instance, so I could rapidly iterate on a single `init` schema. Googling `ALTER TABLE` syntax was annoying, but I figured it would be helpful if I ever did data analysis. However in the future, if I had to iterate rapidly again, I might choose a schema-less database.

### SQL as the "Narrow Waist" for Data Analysis

The Internet Protocol, thanks to its un-opinionated and minimalist protocol design, is the universal networking protocol for the internet. In the network of networks that is the internet, IP doesn't care if your network is based on fiber of wifi, as long as it speaks the language of IP. 

SQL has the potential to become the "narrow waist" for data, where almost all database and data analysis tools are compatible with the SQL query language. Just like IP standardized networking, SQL can be a standard data interface. As this Timescale blog states:

> But SQL is in fact much more than IP. Because data also gets analyzed by humans. And true to the purpose that SQL’s creators initially assigned to it, SQL is readable.

So I knew that if I committed to learning SQL, I would be opening up a world of tools and technologies that could work out of the box.

## PostgreSQL Specific Benefits

- **JSON support.** A critical escape hatch when the data I'm ingesting varies and I didn't want to create a new table every time it potentially changed. This gives me the flexibility of a schema-less database, while limiting it to only specific fields.
- **Full-text search.** `tsvector` offer good-enough search capabilities, like weightings, normalized lexmemes, that I don't have to set up an Elasticsearch stack.
- **RBAC + RLS:** Most SQL databases offer privilege system that can help developers implement a form of Role Based Access Control. PostgreSQL goes further with Row Level Security, allowing you to write policies in SQL to determine if a row can be read or written. By protecting data at the data level, I centralize security policies, and make these policies universal.
    - An example from my schema, which only allows a role to read/write from the account table if `account_id` matches.

```sql
-- ROW LEVEL SECURITY

CREATE FUNCTION current_account_id ()
  RETURNS uuid
  AS $$
  SELECT current_setting('margins.account_id', TRUE)::uuid;
$$
LANGUAGE sql
STABLE;

ALTER TABLE account ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_allow_if_owner ON account FOR ALL USING (account_id = current_account_id ());
```

## Why GraphQL (not REST) for a mainly CRUD API?

At first I was building out a pretty standard REST API using Express, but I was encountering multiple pain points:

- **Fragmented ORM libraries:** Different ORMs like sequelize, bookshelf, typeORM, etc. all have different syntax, quirks, and features, which meant committing to an ORM would be a risky move.
- **Query-Builders and Boilerplate:** I decided to use `sql-template-strings` as an intermediate solution between raw SQL and a full ORM, but I was still writing hundreds of lines of boilerplate to do basic CRUD operations, and even more boilerplate to query relationships, lists, filters, etc. Although the boilerplate got easier to churn out, it was still mind-numbing to write and test and debug.
- **Changing/Maintaining Endpoints:** Every time my frontend data requirements changed, I had to go back and rewrite or add a REST endpoint to support it. Incredibly painful to maintain and document as the total number of endpoints and query parameters grew, and noticeably slowed the pace of iteration.

I figured this work was a textbook example of "undifferentiated heavy lifting." Thanks to the wonders of the internet, I found two frameworks that could introspect my PostgreSQL database, programmatically generate all the CRUD operations I was tediously hand-coding, and expose it as an API, Hasura and PostGraphile. Both created an GraphQL API, and after reading a few breathless posts on how GraphQL was going to take over the world of APIs, I took a closer look. 

Key benefits I found while using GraphQL:

- **N+1 Problem:** No more querying for an author and then adding `N` more book queries to fully assemble a book type, adding up to `N+1` network calls and all the latency that entails.
- **No Over-or-Under Fetching:** Each query could specify exactly fields it required, which was a game-changer. No more client-side assembling of objects.
- **Self-Documenting, Strongly Typed API:** GraphQL's type-system and schema introspection were absolute game-changers. PostGraphile and Hasura also generate all the typings necessary to support CRUD operations, including best practices such as Mutation-specfic input payload types. This meant with no extra work on my part, my API now was fully typed had documentation of each type/relation and the operations they supported. GraphiQL also helped instantly visualize my entire API and made mocking queries fast. No need for another tool like Swagger to generate a well-documented API. **This was a game-changer** because with GraphQL Code Generator and TypeScript on the client side, **I now had programmatically generated end-to-end type safety (further explanation here).**Suddenly, every Query and Mutation I wrote worked the first time.

GraphQL, however, does have certain limitations compared to a REST API:

- **200 OK:** Handling different errors can be painful with GraphQL, since the API always returns 200 OK and includes a JSON error array instead of a 400 or 500-level error. Apollo Client does help with differentiating between network and server errors, and since my API is mainly CRUD I haven't run into any complex errors.
- **Caching:** Requires more configuration and specificity than REST. With REST I can quickly cache based on a few URL parameters, but with GraphQL I'd have to figure out other solutions like persisted queries, which stores query strings on the server, and how to fit validation and freshness with a GraphQL query. However, since my app is focused on individual users and their notes, I'd probably get a low cache hit rate. If I was building an API to serve a large number of unauthenticated users highly-similar content, I might consider a REST API.
- **Security:** The biggest pain with GraphQL might be security, since with the flexibility of its query language it's easy for users to send a complex and expensive query and accidentally DOS your server. Protecting against this requires many tradeoffs, with simpler but more rigid solutions such as the aforementioned whitelisted queries, or more complex but flexible methods such as Query Cost Analysis. Apollo has a [great explainer](https://www.apollographql.com/blog/securing-your-graphql-api-from-malicious-queries-16130a324a6b/). Since my API right now only consumed by my front end client, I plan on implementing the whitelisted queries.

## Why PostGraphile (vs Hasura)?

Both PostGraphile and Hasure solve my critical problem of programmatically generating a CRUD API. I heavily used [Hasura's full stack tutorial](https://hasura.io/learn/), but I have to commend the community-supported developers behind PostGraphile, who wrote incredibly detailed documentation and guides that explained pretty advanced best practices for PostgreSQL and GraphQL APIs. I highly recommend their amazing guide on [schema design](https://www.graphile.org/postgraphile/postgresql-schema-design/). On a technical level, I chose PostGraphile because:

- **TypeScript:** Postgraphile being the same language as the rest of my stack offers insurance if things go wrong and I have to dive into the source code (I don't know Haskell).
- **Runs in Node.js:** Don't need a separate docker container or server just for GraphQL. I can just run it as a library in an Express server.
- **Extensible:** I can write plugins in JavaScript and it'll integrate seamlessly. I already use  plugins for many-to-many relationships and filters. Custom resolvers, fields, types, means that I know my GraphQL server can evolve with my application. (Hasura doesn't seem to have plugins)
- **Performant:** I don't have the scale necessary to worry about performance yet, but all blog posts, StackOverflow comments, and Hacker News reviews indicate that PostGraphile as similar if not better performance than existing solutions
- **Strong PostgreSQL Support:** PostGraphile can set PostgreSQL Configuration Parameters for each transaction, such as `role`, which enables RBAC and RLS. Moreover it has PostgreSQL function support and can map them to custom queries, mutations, and computed columns.
- **GraphQL Best Practices:** Out-of-the-box cursor-based pagination, global object identification, and fully compatible with Relay. Saves an incredible amount of time, and it just works.

## Why NGINX (and having a Reverse Proxy)

Originally I was searching for an alternative to paying for an ELB instance, then I found that learning enough NGINX to get it running and dockerized wouldn't be terribly difficult. Many thanks to Digital Ocean for their [detailed guide](https://www.digitalocean.com/community/tutorials/how-to-secure-a-containerized-node-js-application-with-nginx-let-s-encrypt-and-docker-compose). Key benefits I found were:

- **SSL Termination:** Configuring protocols and managing expiring SSL certificates isn't the core function of my application. With NGINX I have one, high-optimized place, to terminate SSL requests.
- **Load Balancing:** I don't have the scale to need load balancing, but it's nice to know that with a few lines of config I can instantly get production-level load balancing

Also, [Express documentation](https://expressjs.com/en/advanced/best-practice-performance.html) recommends a reverse proxy when running in production environment:

> Handing over tasks that do not require knowledge of application state to a reverse proxy frees up Express to perform specialized application tasks. For this reason, it is recommended to run Express behind a reverse proxy like Nginx or HAProxy in production.


[^1]:[https://blog.timescale.com/blog/why-sql-beating-nosql-what-this-means-for-future-of-data-time-series-database-348b777b847a/](https://blog.timescale.com/blog/why-sql-beating-nosql-what-this-means-for-future-of-data-time-series-database-348b777b847a/)

[^2]: [https://www.graphile.org/postgraphile/security/](https://www.graphile.org/postgraphile/security/)