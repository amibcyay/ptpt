# -*- coding: utf-8 -*-
"""
Verb infinitives that are also adjectives (or adj/nouns), from
Portuguese With Carla — Cognate Patterns PDF, AR section
(“nouns or adjectives (not verbs!)”, pages 29–30).

Only forms that appear as the same spelling on the 500-verbs list
are flagged. Other AR cognates (familiar, popular, regular, …) are
adjectives/nouns but are not verbs on that list.
"""

from __future__ import annotations

# Exact infinitive ↔ adjective/noun homographs from the cognate PDF AR list
# (pp. 29–30: “nouns or adjectives (not verbs!)”).
# Checked against the 499-verb list: only "circular" appears in both.
# Other AR cognates (familiar, popular, regular, similar, solar, vulgar, …)
# are adjectives/nouns in the PDF but are NOT infinitives on the verb list.
ALSO_ADJECTIVE: dict[str, dict[str, object]] = {
    "circular": {
        "note": "same spelling as adjective/noun",
        "gloss": "circular / round / circulating (adj.); memo (noun)",
        "examples": [
            {
                "label": "adjective",
                "form": "circular",
                "pt": "A estrada circular evita o centro da cidade.",
                "en": "The ring road avoids the city centre.",
            },
            {
                "label": "noun",
                "form": "circular",
                "pt": "Recebi um circular interno esta manhã.",
                "en": "I received an internal circular this morning.",
            },
            {
                "label": "adjective",
                "form": "circular",
                "pt": "A mesa é circular e cabe seis pessoas.",
                "en": "The table is round and seats six people.",
            },
        ],
    },
}


def also_adj_note(inf: str) -> str:
    info = ALSO_ADJECTIVE.get(inf)
    if not info:
        return ""
    return str(info.get("note") or "")


def also_adj_examples(inf: str) -> list[dict[str, str]]:
    info = ALSO_ADJECTIVE.get(inf)
    if not info:
        return []
    return list(info.get("examples") or [])  # type: ignore[arg-type]
