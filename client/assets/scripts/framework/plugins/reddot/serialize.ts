export class TNode {
    key: number;
    name: string;
    parent: number;
    selfCount: number;
    totalCount: number;
}

export class TTree {
    nodes: TNode[];
}