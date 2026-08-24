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
ALSO_ADJECTIVE: dict[str, str] = {
    "circular": "also adj./noun (e.g. estrada circular, circular interno)",
}
