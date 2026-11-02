declare module "d3-sankey" {
  export interface SankeyNodeMinimal<N, L> {
    index?: number;
    x0?: number;
    x1?: number;
    y0?: number;
    y1?: number;
    value?: number;
    depth?: number;
    height?: number;
    layer?: number;
    sourceLinks?: SankeyLink<N, L>[];
    targetLinks?: SankeyLink<N, L>[];
  }
  export type SankeyNode<N, L> = N & SankeyNodeMinimal<N, L>;

  export interface SankeyLinkMinimal<N, L> {
    source: string | number | SankeyNode<N, L>;
    target: string | number | SankeyNode<N, L>;
    value: number;
    y0?: number;
    y1?: number;
    width?: number;
    index?: number;
  }
  export type SankeyLink<N, L> = L & SankeyLinkMinimal<N, L>;

  export interface SankeyGraph<N, L> {
    nodes: SankeyNode<N, L>[];
    links: SankeyLink<N, L>[];
  }

  export type SankeyAlign = (node: SankeyNode<unknown, unknown>, n: number) => number;
  export const sankeyLeft: SankeyAlign;
  export const sankeyRight: SankeyAlign;
  export const sankeyCenter: SankeyAlign;
  export const sankeyJustify: SankeyAlign;

  export interface SankeyLayout<N, L> {
    (graph: { nodes: N[]; links: Array<L & { source: string | number; target: string | number; value: number }> }): SankeyGraph<N, L>;
    nodeId(id: (node: SankeyNode<N, L>) => string | number): this;
    nodeAlign(align: SankeyAlign): this;
    nodeWidth(width: number): this;
    nodePadding(padding: number): this;
    extent(extent: [[number, number], [number, number]]): this;
    size(size: [number, number]): this;
    iterations(iterations: number): this;
    nodeSort(sort: ((a: SankeyNode<N, L>, b: SankeyNode<N, L>) => number) | null | undefined): this;
    linkSort(sort: ((a: SankeyLink<N, L>, b: SankeyLink<N, L>) => number) | null | undefined): this;
  }

  export function sankey<N = Record<string, unknown>, L = Record<string, unknown>>(): SankeyLayout<N, L>;
  export function sankeyLinkHorizontal<N = Record<string, unknown>, L = Record<string, unknown>>(): (link: SankeyLink<N, L>) => string | null;
}
