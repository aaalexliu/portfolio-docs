---
name: "Architecture: Serverless Microservices"
route: /margins/serverless-microservices
menu: Margins 
---

# Architecture: Serverless Microservices

I wanted to create a way to receive an email, store it, parse the contents, and send any notes to my GraphQL API. Serverless Microservice. used Amazon Simple Email Service, a Lambda to reject unregistered emails, S3 to store the email and trigger a Lambda, which parses the email attachment and POSTs the notes to my GraphQL endpoint.

## Why A Serverless Microservice?

In my case, I was already leaning towards the Serverless route primarily because I did not want to deal with the complexities of email server management, networking configurations, and IP address reputations. Outsourcing this "undifferentiated heavy lifting" to AWS made perfect sense for my use case, and SES (Simple Email Service) both met my email receiving needs and was incredibly cheap. Going with the Serverless approach meant I was reaping its main benefits, which I heavily quote/summarize from  [Serverless Architectures](https://martinfowler.com/articles/serverless.html):

**Serverless Benefits:**

- **Reduced operational cost:** The first are infrastructure cost gains that come purely from sharing infrastructure (e.g., hardware, networking) with other people. The second are labor cost gains: you'll be able to spend less of your own time on an outsourced Serverless system than on an equivalent developed and hosted by yourself.
- **Reduced development cost:** IaaS and PaaS are based on the premise that server and operating system management can be commodified. Serverless Backend as a Service, on the other hand, is a result of entire application components being commodified.
- **Reduced scaling cost:** Pay only for the compute and storage you need.
- **Easier Operational Management**
    - Horizontal scaling is granular and automatic. No more worrying about maximum number of concurrent requests before performance takes a hit.
    - Reduced packaging and deployment complexity. No shell scripts, k8s configurations
    - Faster time to market and continuous experimentation

This choice also meant I was also essentially building a microservice, since SES is its own process, focused specifically on emails, and independently deployable of my main GraphQL API. Seamless integration with S3 also solved the problem of storage, and meant that I didn't have to mess with storing rich media likes emails in my PostgreSQL database.

Essentially, I was leveraging the key benefits of a microservice-based architecture, which I quote from [Martin Fowler's Microservice's Guide](https://martinfowler.com/microservices/):

**Microservices provide benefits…**

- **Strong Module Boundaries:** Microservices reinforce modular structure, which is particularly important for larger teams.
- **Independent Deployment:** Simple services are easier to deploy, and since they are autonomous, are less likely to cause system failures when they go wrong.
- **Technology Diversity:** With microservices you can mix multiple languages, development frameworks and data-storage technologies.

The primary question was whether I should have integrated the parsing and storage of notes directly into my Express server. Once an email was stored in S3, I could have sent an event to my Express server.

However, my specific use case of processing emails fit perfectly with the stateless, event-driven model of Serverless. I eventually decided to go with the full FaaS route using AWS Lambda, because beyond the aforementioned architecture level benefits, tooling had improved for FaaS, and offered additional benefits:

- **Monitoring:** AWS Cloudwatch centralizes logs, provides clear usage statistics, and works out of the box with Lambda.
- **Debugging:** SAM (Serverless Application Model) provides native support for locally debugging Lambdas, and supports step through debugging. All directly integrated into VSCode.
- **Deployment:** SAM also enabled Continuous Deployment by turning deployment into a CLI command and a confirmation step. No more manually zipping code into files or setting environment variables. Though CloudFormation is less predictable than Terraform, it was good enough for my use case of deploying Lambda functions.

However, there were still certain drawbacks that I was able to mitigate/tolerate:

- **Security**:
    - Figuring out IAM roles and permissions was not fun, but I figured this would be a one-time investment in proper security.
    - Cognito response times are acceptable for users logging in, but not for a server-side function that is billed from the 100ms increment. Decided to roll my own RS256 JWT and distribute the private key to my Lambdas to implement server-side authentication.
- **Eventual Consistency:** My use case of processing emails didn't require strong consistency, since I expect users to understand a delay when sending an email versus interacting with a UI.
- **Distribution:** I had focus on minimizing remote calls to reduce latency and potential network failures. Moreover, my data processing use case was a simple, linear, step-by-step process, and didn't require coordinating many processes.
- **Vendor Lock-in:** CloudFormation isn't something you pick up in an afternoon, but I figured that investing in learning how the industry leader in cloud services implements Infrastructure-as-Code would be useful. SES also essentially meant I had to use other AWS resources to store or process incoming emails, thankfully every downstream service is commoditized and extremely cheap.

Overall, for this case, I was happy to eat the 'microservice premium' to get a fully functional email processing service for pennies. 

## SAM vs. Serverless Framework

SAM and the Serverless Framework are both popular options for FaaS, and the Serverless Framework has been catching up to SAM's native support for AWS resources. The Serverless Framework's main advantages are multi-vendor support and a large plugin ecosystem, whereas with SAM you're locked into AWS and native features. 

However, the key reason I chose SAM was it's native support for a local Lambda execution environment,[^1] which enabled local building, testing, and step-through debugging. The Serverless Framework is upfront and states their Lambda emulation is "not a 100% perfect emulation, there may be some differences, but it works for the vast majority of users." However, I couldn't find any details on potential differences or pitfalls. There are other plugins for offline testing, like [serverless-offline](https://github.com/prisma-labs/serverless-plugin-typescript) but I didn't want to have to rely on a third-party plugin for such critical functionality like local debugging.

[^1]: "The CLI provides a Lambda-like execution environment locally. It helps you catch issues upfront by providing parity with the actual Lambda execution environment." [https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)

[^2]: [https://www.serverless.com/framework/docs/providers/aws/cli-reference/invoke-local/](https://www.serverless.com/framework/docs/providers/aws/cli-reference/invoke-local/)