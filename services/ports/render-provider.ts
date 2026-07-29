import type { Product, Template } from "@/domain";

export type RenderInput = {
  product: Product;
  template: Template;
  variables: Record<string, string>;
};

export type RenderOutput = {
  svg: string;
  png?: Uint8Array;
  pdf?: Uint8Array;
};

export interface RenderProvider {
  render(input: RenderInput): Promise<RenderOutput>;
}
