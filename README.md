# Buy It or Leave It

A mobile-first personal judgment app. The purchase workflow is one vertical in a broader personal judgment layer. Jev supplies nine narrow semantic signals; local code calculates cost per use, combines weights, checks budget, and suggests a direction. The person records the actual Buy it / Leave it outcome. History is kept in browser localStorage.

## Run locally

Requires Node.js 20 or newer and a TypeSafe API key.

1. Copy `.env.example` to `.env`.
2. Replace `replace-with-your-key` with your own `TYPESAFE_API_KEY`. Keep `.env` private.
3. Run `npm start` and open `http://localhost:3000`.
4. Run `npm test` for composition tests.

The server uses the [TypeSafe System One HTTP endpoint](https://docs.typesafe.ai/api.md) with `jev-latest`, a named JSON state, and nine independent Noul questions. The key is read only by `server.js` and never shipped to the browser. No installation is needed beyond Node.js.

## Decision policy

Each Noul returns a probability of “yes,” not a guarantee. The app averages positively framed signals and the inverse of risk signals with explicit weights in `judgments.js`. A score of 42–58, an over-budget price, or missing affordability context leads to **Pause & decide**. The displayed score is a product rule over signals, not a probability that buying is correct. Cost per use uses the entered six-month expected uses. There is no hidden purchasing action.

The nine questions live in `judgments.js`, so another decision vertical can define its own state, questions, and composition policy without changing the purchase UI. This MVP records outcomes locally; it does not retrain or calibrate Jev.

## Notes

- A real Jev call was not run during development because no TypeSafe key was provided. The server returns an explicit configuration error until a key is supplied.
- The TypeSafe documentation index and the official JavaScript SDK repository were checked on 2026-09-19. The direct documentation subpages were intermittently inaccessible from this environment; the request and answer shapes were checked against the official SDK types.
- If deploying, set `TYPESAFE_API_KEY` as a server secret. Do not put it in a frontend environment variable or static hosting configuration.

## Deploy on Render

This app needs a **Node web service**, not static-site hosting, because the TypeSafe key must stay on the server.

1. Put the `buy-it-or-leave-it` project in a GitHub repository. Do not commit `.env`; it is ignored by `.gitignore`.
2. In Render, choose **New → Web Service** and connect that repository.
3. Choose **Node**, use `npm install` as the build command and `npm start` as the start command. If the repository contains this project in a subfolder, set its root directory to that folder.
4. Under the Render service's **Environment** settings, add `TYPESAFE_API_KEY` with your real key. Optionally add `TYPESAFE_MODEL=jev-latest`. Do not add the key to GitHub or to public files.
5. Deploy. Open the `onrender.com` address Render provides, then submit a sample purchase to verify the Jev call.

Render sets `PORT` automatically. The server binds to `0.0.0.0` on Render and to `127.0.0.1` locally. A public deployment lets anyone send requests using your server-side TypeSafe account; review your TypeSafe usage and hosting access settings before sharing the URL widely.

## License

MIT. See `LICENSE`.
