// This is clearly an omission in the Vite typings
// https://github.com/pd4d10/vite-plugin-svgr/issues/118

declare module '*.svg?react' {
  import type * as React from 'react';
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
