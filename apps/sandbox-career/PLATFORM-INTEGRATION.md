# CareerGateway Platform Integration

The CareerGateway UI is distributed as two standard custom elements. They do not
require React, Vue, Angular, Lit, or a framework-specific runtime in the host app.
Build the single ES module from the repository root:

```bash
pnpm --filter sandbox-career build
```

Publish `apps/sandbox-career/dist/savanna-career.v1.js` with your static assets and
load it once in the host page:

```html
<script type="module" src="/assets/savanna-career.v1.js"></script>
```

Use attributes to configure the elements. `api-key` must be a publishable key; never
embed the secret key used to issue or revoke credentials.

```html
<savanna-job-card
  job="J-9"
  api="https://api.example.org"
  api-key="pk_live_xxx"
  lang="en"
></savanna-job-card>

<savanna-credential
  id="C-7"
  api="https://api.example.org"
  api-key="pk_live_xxx"
  lang="en"
></savanna-credential>
```

Attributes can be changed after mount. The elements abort stale requests, reload when
their job/credential ID, API URL, or key changes, and emit bubbling `savanna:ready`
and `savanna:error` custom events. Event details contain the job or credential ID and,
on error, a message.

## React

Load the module in the app shell's HTML, then use the custom tags in JSX. For TypeScript,
declare the custom tags once:

```tsx
import type { HTMLAttributes } from "react";
import { useEffect, useRef } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "savanna-job-card": HTMLAttributes<HTMLElement> & {
        job: string;
        api: string;
        "api-key": string;
        lang?: string;
      };
      "savanna-credential": HTMLAttributes<HTMLElement> & {
        id: string;
        api: string;
        "api-key": string;
        lang?: string;
      };
    }
  }
}
```

Use a ref for custom events; this works with React versions that do not forward
colon-named custom events through JSX:

```tsx
const jobRef = useRef<HTMLElement>(null);

useEffect(() => {
  const node = jobRef.current;
  if (!node) return;
  const onReady = (event: Event) => {
    console.log((event as CustomEvent<{ job: string }>).detail.job);
  };
  node.addEventListener("savanna:ready", onReady);
  return () => node.removeEventListener("savanna:ready", onReady);
}, []);

return <savanna-job-card ref={jobRef} job="J-9" api={apiUrl} api-key={publicKey} lang="en" />;
```

## Vue 3

Tell Vue's template compiler that these tags are browser custom elements. For Vite:

```ts
vue({
  template: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith("savanna-"),
    },
  },
});
```

Then put the tags in a Vue template. Register event listeners on a template ref from
`onMounted`, and remove them in `onBeforeUnmount`.

```vue
<template>
  <savanna-job-card ref="jobCard" :job="jobId" :api="apiUrl" :api-key="publicKey" lang="en" />
  <savanna-credential id="C-7" :api="apiUrl" :api-key="publicKey" lang="en" />
</template>
```

## Angular

Load the module once from the app shell. Add `CUSTOM_ELEMENTS_SCHEMA` to the component
or module that contains the custom tags, and bind string-valued attributes:

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

@Component({
  selector: "app-careers",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <savanna-job-card
      [attr.job]="jobId"
      [attr.api]="apiUrl"
      [attr.api-key]="publicKey"
      lang="en">
    </savanna-job-card>
    <savanna-credential
      id="C-7"
      [attr.api]="apiUrl"
      [attr.api-key]="publicKey"
      lang="en">
    </savanna-credential>
  `,
})
export class CareersComponent {
  jobId = "J-9";
  apiUrl = "https://api.example.org";
  publicKey = "pk_live_xxx";
}
```

## Deployment

Serve the host page, module, and API over HTTPS. Allow the host's exact origin in API
CORS and allow `GET`, `POST`, `OPTIONS`, and the `X-Savanna-Key` header. The PDF link
uses the publishable key in its query string because a normal link cannot attach a
custom request header. Keep secret credentials on the server.

The runnable plain-page integration is [partner-demo.html](./partner-demo.html); it
loads the built module and exercises the API from a separate web origin/port.
