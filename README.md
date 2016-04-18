## Runtime Autocomplete Endpoint

_(intended for [browser-based brackets](https://www.npmjs.com/package/brackets) usage)_

This express route handler replies with JSON of REPL-tab-like property suggestions for an empty or incomplete line of code passed in as if it were in the context of the live app.  This allows suggestions of properties assigned at runtime.

Though properties are only checked and code is never executed, this should only be used in dev, never production environments.

### Usage
```javascript
express.Router()
//add your routes
.get("/repl",require("runtime-autocomplete")({
    ,log:console.log// what to log with (pass ()=>{} to silence)
}))
```