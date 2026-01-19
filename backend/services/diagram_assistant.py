"""Rule-based assistant that interprets diagram edit instructions."""

from __future__ import annotations

import random
import re
from typing import Dict, Any, List, Tuple, Optional, Union
from uuid import uuid4


class DiagramAssistant:
    """Simple assistant that turns natural language prompts into canvas mutations."""

    def __init__(self):
        self._add_pattern = re.compile(
            r"(?:add|create|insert)\s+(?:a\s+)?(?:new\s+)?node(?:\s+named|\s+called|\s+for)?\s+(?P<label>.+)",
            re.IGNORECASE,
        )
        self._remove_pattern = re.compile(
            r"(?:remove|delete)\s+(?:the\s+)?node\s+(?:named\s+)?(?P<label>.+)",
            re.IGNORECASE,
        )
        self._connect_pattern = re.compile(
            r"(?:connect|link)\s+(?P<source>.+?)\s+(?:to|with)\s+(?P<target>.+)",
            re.IGNORECASE,
        )

    def apply_instruction(
        self,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        message: str,
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], str]:
        """Return updated nodes/edges after interpreting a message."""
        text = message.strip()
        if not text:
            return nodes, edges, "Please provide an instruction so I know what to change."

        lowered = text.lower()
        if "add" in lowered and "node" in lowered:
            label = self._extract_label(self._add_pattern, text)
            if not label:
                return nodes, edges, "I heard you want a new node. Tell me its name and purpose."
            new_nodes = self._add_node(nodes, label)
            return new_nodes, edges, f"Added node '{label}'. You can drag it to position it on the canvas."

        if any(keyword in lowered for keyword in ("remove", "delete")) and "node" in lowered:
            label = self._extract_label(self._remove_pattern, text)
            if not label:
                return nodes, edges, "Let me know which node to remove."
            new_nodes, new_edges, removed = self._remove_node(nodes, edges, label)
            if not removed:
                return nodes, edges, f"I could not find a node named '{label}'."
            return new_nodes, new_edges, f"Removed node '{removed}'."

        if "connect" in lowered or "link" in lowered:
            result = self._extract_connection(self._connect_pattern, text)
            if not result:
                return (
                    nodes,
                    edges,
                    "Specify the source and target to connect, e.g. 'connect API to Database'.",
                )
            source_label, target_label = result
            new_edges, summary = self._connect_nodes(nodes, edges, source_label, target_label)
            return nodes, new_edges, summary

        if "rename" in lowered:
            summary, new_nodes = self._rename_node(nodes, text)
            return new_nodes, edges, summary

        return (
            nodes,
            edges,
            "I can add, remove, rename, or connect nodes. Try something like 'add node Payment Processor'.",
        )

    def _extract_label(self, pattern: re.Pattern, text: str) -> Optional[str]:
        match = pattern.search(text)
        if not match:
            return None
        label = match.group("label").strip().strip("'\"")
        return label if label else None

    def _extract_connection(self, pattern: re.Pattern, text: str) -> Optional[Tuple[str, str]]:
        match = pattern.search(text)
        if not match:
            return None
        source = match.group("source").strip().strip("'\"")
        target = match.group("target").strip().strip("'\"")
        if not source or not target:
            return None
        return source, target

    def _add_node(self, nodes: List[Dict[str, Any]], label: str) -> List[Dict[str, Any]]:
        new_node = {
            "id": f"node_{uuid4().hex[:8]}",
            "type": "default",
            "position": self._next_position(len(nodes)),
            "data": {"label": label},
        }
        return [*nodes, new_node]

    def _remove_node(
        self,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        label: str,
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Optional[str]]:
        label_lower = label.lower()
        remaining_nodes = []
        removed_id = None
        removed_label = None
        for node in nodes:
            node_label = (node.get("data", {}).get("label") or node.get("label") or "").lower()
            if node_label == label_lower:
                removed_id = node["id"]
                removed_label = node.get("data", {}).get("label") or label
                continue
            remaining_nodes.append(node)

        if not removed_id:
            return nodes, edges, None

        remaining_edges = [
            edge for edge in edges if edge.get("source") != removed_id and edge.get("target") != removed_id
        ]
        return remaining_nodes, remaining_edges, removed_label

    def _connect_nodes(
        self,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        source_label: str,
        target_label: str,
    ) -> Tuple[List[Dict[str, Any]], str]:
        source = self._find_node_id(nodes, source_label)
        target = self._find_node_id(nodes, target_label)
        if not source or not target:
            missing = source_label if not source else target_label
            return edges, f"I could not find '{missing}'. Make sure the node exists."

        edge_id = f"edge_{uuid4().hex[:8]}"
        new_edge = {
            "id": edge_id,
            "source": source,
            "target": target,
            "type": "smoothstep",
            "label": f"{source_label} → {target_label}",
        }
        return [*edges, new_edge], f"Connected '{source_label}' to '{target_label}'."

    def _rename_node(self, nodes: List[Dict[str, Any]], text: str) -> Tuple[str, List[Dict[str, Any]]]:
        match = re.search(
            r"rename\s+(?P<old>.+?)\s+(?:to|as)\s+(?P<new>.+)",
            text,
            re.IGNORECASE,
        )
        if not match:
            return "Tell me which node to rename, e.g. 'rename API to Service Layer'.", nodes
        old_label = match.group("old").strip().strip("'\"")
        new_label = match.group("new").strip().strip("'\"")
        if not old_label or not new_label:
            return "Please provide both the existing and new names.", nodes

        updated = False
        updated_nodes = []
        for node in nodes:
            node_label = node.get("data", {}).get("label") or ""
            if node_label.lower() == old_label.lower():
                node = {**node, "data": {**node.get("data", {}), "label": new_label}}
                updated = True
            updated_nodes.append(node)

        if not updated:
            return f"I could not find '{old_label}' to rename.", nodes
        return f"Renamed '{old_label}' to '{new_label}'.", updated_nodes

    def _find_node_id(self, nodes: List[Dict[str, Any]], label: str) -> Optional[str]:
        target = label.lower()
        for node in nodes:
            node_label = node.get("data", {}).get("label") or node.get("label") or ""
            if node_label.lower() == target:
                return node["id"]
        return None

    def _next_position(self, index: int) -> Dict[str, float]:
        """Generate a deterministic but spread-out position."""
        column = index % 4
        row = index // 4
        jitter = random.randint(-30, 30)
        return {"x": 160 * column + jitter, "y": 140 * row + jitter}
