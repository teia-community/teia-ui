declare module '*.md' {
    import type { ComponentType } from 'react';
    export const ReactComponent: ComponentType;
    const Component: ComponentType;
    export default Component;
}

declare module '*.svg' {
    import type { ComponentType, SVGProps } from 'react';
    export const ReactComponent: ComponentType<SVGProps<SVGSVGElement>>;
    const src: string;
    export default src;
}