import { Graph } from '@/lib/types';

export function toMarkdown(graph: Graph): string {
  const root = graph.nodes.find((node) => node.id === graph.rootId);
  const lines: string[] = [];
  lines.push(`# ${root?.title ?? 'Thinking Map'} Exploration`);
  lines.push('');
  lines.push('## Executive Summary');
  lines.push(`- Total nodes: ${graph.nodes.length}`);
  lines.push(`- Total edges: ${graph.edges.length}`);
  if (root) {
    lines.push(`- Root topic: ${root.title}`);
  }
  const pinned = graph.nodes.filter((node) => node.pinned);
  if (pinned.length) {
    lines.push(`- Pinned focus areas: ${pinned.map((node) => node.title).join(', ')}`);
  }
  lines.push('');
  lines.push('## Nodes');
  graph.nodes.forEach((node) => {
    lines.push(`- ${node.title} (${node.type}, depth ${node.depth})`);
  });
  lines.push('');
  lines.push('## Adjacency List');
  graph.nodes.forEach((node) => {
    const outgoing = graph.edges.filter((edge) => edge.sourceId === node.id);
    if (!outgoing.length) {
      lines.push(`- ${node.title}: (no outgoing edges)`);
    } else {
      lines.push(`- ${node.title}:`);
      outgoing.forEach((edge) => {
        const target = graph.nodes.find((candidate) => candidate.id === edge.targetId);
        lines.push(`  - [${edge.relation}] → ${target?.title ?? edge.targetId}`);
      });
    }
  });
  return lines.join('\n');
}
