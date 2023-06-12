```
node-typescript
├─ .cspell.json                                  [configuration file for the cspell spell checker]
├─ .editorconfig                                  [configuration file for editor preferences]
├─ .env                                          [file for environment variables]
├─ .eslintignore                                 [list of files/directories to ignore by ESLint]
├─ .eslintrc.json                                [configuration file for ESLint]
├─ .gitignore                                    [list of files/directories to ignore by Git]
├─ .prettierignore                               [list of files/directories to ignore by Prettier]
├─ .prettierrc.cjs                               [configuration file for Prettier]
├─ LICENSE                                       [license file for the project]
├─ README.md                                     [a file that contains the project's description]
├─ index.d.ts                                    [TypeScript declarations file]
├─ package-lock.json                             [an automatically generated file that stores the exact versions of all dependencies installed in the project]
├─ package.json                                  [the main configuration file for the project, which lists all dependencies and scripts]
├─ src                                           [directory that contains the source code of the project]
│  ├─ app.ts                                     [main entry point of the application]
│  ├─ controllers                                [directory that contains the controllers for the API]
│  │  └─ auth                                    [directory that contains the authentication controllers]
│  │     ├─ admin                                [directory that contains the authentication controller for admin users]
│  │     │  └─ admin.auth.ts                     [file that contains the implementation of the admin authentication controller]
│  │     └─ user                                 [directory that contains the authentication controller for regular users]
│  │        └─ user.auth.ts                      [file that contains the implementation of the user authentication controller]
│  ├─ helpers                                    [directory that contains helper functions]
│  │  ├─ common                                  [directory that contains common helper functions]
│  │  │  ├─ backend.functions.ts                 [file that contains common backend functions]
│  │  │  ├─ environment.ts                       [file that contains environment variables]
│  │  │  ├─ init_app.ts                          [file that initializes the application]
│  │  │  ├─ init_mongodb.ts                      [file that initializes MongoDB]
│  │  │  ├─ init_mysql.ts                        [file that initializes MySQL]
│  │  │  ├─ init_redis.ts                        [file that initializes Redis]
│  │  │  ├─ init_scheduler.ts                    [file that initializes the scheduler]
│  │  │  ├─ init_socket.ts                       [file that initializes socket.io]
│  │  │  ├─ init_winston.ts                      [file that initializes Winston]
│  │  │  └─ route_versions                       [directory that contains different versions of the routes]
│  │  │     └─ v1.ts                             [file that contains version 1 of the routes]
│  │  ├─ joi                                     [directory that contains Joi validation schemas]
│  │  ├─ service                                 [directory that contains service functions]
│  │  │  ├─ nodemailer                           [directory that contains email service functions]
│  │  │  └─ socket.io                            [directory that contains socket.io service functions]
│  │  └─ shared                                  [directory that contains shared helper functions]
│  │     └─ logger.ts                            [file that contains the implementation of the logger]
│  ├─ middlewares                                [directory that contains middleware functions]
│  │  ├─ jwt                                     [file that contains JWT middleware implementation]
│  │  ├─ permissions                             [file that contains permissions middleware implementation]
│  │  └─ shared                                  [directory that contains shared middleware functions]
│  ├─ models                                     [directory that contains the database models]
│  │  └─ auth                                    [directory that contains the authentication models]
│  │     ├─ admin                                [directory that contains the admin authentication model]
│  │     │  └─ admin.model.ts                    [file that contains the implementation of the admin authentication model]
│  │     └─ user                                 [directory that contains the user authentication model]
│  │        └─ user.model.ts                     [file that contains the implementation of the user authentication model]
│  ├─ prisma                                     [directory that contains Prisma-related files]
│  │  └─ schema.prisma                           [file that defines the database schema using Prisma's DS]
│  ├─ routes                                     [directory that contains the route files for the application]
│  │  └─ auth                                    [directory that contains the authentication routes]
│  │     ├─ admin                                [directory that contains the authentication routes for admin users]
│  │     │  └─ admin.route.ts                    [This file contains the route definitions for admin authentication]
│  │     └─ user                                 [directory that contains the authentication routes for regular users]
│  │        └─ user.route.ts                     [This file contains the route definitions for user authentication]
│  └─ shared                                     [directory that contains shared files for the application]
├─ tsconfig.build.json                            [This file contains the TypeScript configuration for building the application]
├─ tsconfig.json                                  [This file contains the main TypeScript configuration for the application]
└─ tsconfig.release.json                          [This file contains the TypeScript configuration for releasing the application]

```

## Project Guidelines

- Project tree should be maintained throughout the development.
- Controllers, Models, Middlewares, and Helpers should have module-wise directory separation and the files should be named as `submodule.module.ts` wherever required.
- While adding new routes, it should be first done in their respective route directory and that should be imported in `src/helpers/common/route_versions/v1.ts`. This TS file is then loaded into `app.ts`.
- `src/helpers/common/backend.functions.ts` file should contain functions that are used multiple times throughout the project.
- Avoid using type as `any`, create a new TS file in the shared folder as per module name and then import that file with proper type declarations.
- Constants should be initially loaded in `src/helpers/common/environment.ts` file with proper object scope as Global, Database, Mail, Whatsapp, etc.
- Services based on client development structure should be kept inside `src/helpers/common` folder as `init_modulename.ts` and then imported wherever required.
- Data fetched from the request should be validated properly using Joi validation and schema for validations should be present inside `src/helpers/joi` directory with module-wise directory separation.
- Logic for service implementation should be present inside `src/helpers/service`.
- Use Passport JS for creating auth strategies
- API's should be properly maintained using Postman
- Single postman account should be used for maintaining API's
- Separate collection should be created for all the projects
