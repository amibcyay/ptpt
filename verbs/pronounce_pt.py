# -*- coding: utf-8 -*-
"""
Approximate European Portuguese IPA + English-based phonetic respelling.

Not a full phonology engine — good enough for learner hover tips.
Irregulars live in OVERRIDES; everything else uses orthography rules (EP-leaning).
"""
from __future__ import annotations

import re
import unicodedata

# word (lowercase) -> (ipa without slashes, english respelling)
OVERRIDES: dict[str, tuple[str, str]] = {
    # ser
    "ser": ("seɾ", "sehr"),
    "sou": ("so", "soh"),
    "és": ("ɛʃ", "esh"),
    "é": ("ɛ", "eh"),
    "somos": ("ˈsomuʃ", "SOH-moosh"),
    "são": ("sɐ̃w̃", "sowng"),
    # estar
    "estar": ("ɨʃˈtaɾ", "ish-TAHR"),
    "estou": ("ɨʃˈto", "ish-TOH"),
    "estás": ("ɨʃˈtaʃ", "ish-TASH"),
    "está": ("ɨʃˈta", "ish-TAH"),
    "estamos": ("ɨʃˈtɐmuʃ", "ish-TAH-moosh"),
    "estão": ("ɨʃˈtɐ̃w̃", "ish-TOWNG"),
    # ter
    "ter": ("teɾ", "tehr"),
    "tenho": ("ˈtɐɲu", "TAH-nyoo"),
    "tens": ("tɐ̃j̃ʃ", "taynsh"),
    "tem": ("tɐ̃j̃", "tayn"),
    "temos": ("ˈtɐmuʃ", "TAH-moosh"),
    "têm": ("tɐ̃j̃", "tayn"),
    # ir
    "ir": ("iɾ", "eer"),
    "vou": ("vo", "voh"),
    "vais": ("vajʃ", "vysh"),
    "vai": ("vaj", "vy"),
    "vamos": ("ˈvɐmuʃ", "VAH-moosh"),
    "vão": ("vɐ̃w̃", "vowng"),
    # haver
    "haver": ("ɐˈveɾ", "uh-VEHR"),
    "há": ("a", "ah"),
    "hei": ("ɐj", "eye"),
    "hás": ("aʃ", "ahsh"),
    "havemos": ("ɐˈvemuʃ", "uh-VEH-moosh"),
    "hão": ("ɐ̃w̃", "owng"),
    # pronouns / function words
    "eu": ("ew", "eh-oo"),
    "tu": ("tu", "too"),
    "ele": ("ˈelɨ", "EH-luh"),
    "ela": ("ˈɛlɐ", "EH-luh"),
    "eles": ("ˈelɨʃ", "EH-lish"),
    "elas": ("ˈɛlɐʃ", "EH-lash"),
    "nós": ("nɔʃ", "nosh"),
    "vocês": ("vuˈseʃ", "voo-SESH"),
    "o": ("u", "oo"),
    "a": ("ɐ", "uh"),
    "os": ("uʃ", "oosh"),
    "as": ("ɐʃ", "ush"),
    "um": ("ũ", "oon"),
    "uma": ("ˈumɐ", "OO-muh"),
    "de": ("dɨ", "duh"),
    "do": ("du", "doo"),
    "da": ("dɐ", "duh"),
    "em": ("ɐ̃j̃", "ayn"),
    "no": ("nu", "noo"),
    "na": ("nɐ", "nuh"),
    "com": ("kõ", "kong"),
    "por": ("puɾ", "poor"),
    "para": ("pɐɾɐ", "PUH-ruh"),
    "não": ("nɐ̃w̃", "nowng"),
    "sim": ("sĩ", "seen"),
    "que": ("kɨ", "kuh"),
    "e": ("i", "ee"),
    "ou": ("ow", "oh"),
    "se": ("sɨ", "suh"),
    "me": ("mɨ", "muh"),
    "te": ("tɨ", "tuh"),
    "lhe": ("ʎɨ", "lyuh"),
    "nos": ("nuʃ", "noosh"),
    "vos": ("vuʃ", "voosh"),
    "já": ("ʒa", "zhah"),
    "também": ("tɐ̃ˈbɐ̃j̃", "tung-BAYN"),
    "muito": ("ˈmũjtu", "MOOYN-too"),
    "mais": ("majʃ", "mysh"),
    "menos": ("ˈmɛnuʃ", "MEH-noosh"),
    "aqui": ("ɐˈki", "uh-KEE"),
    "ali": ("ɐˈli", "uh-LEE"),
    "hoje": ("ˈoʒɨ", "OH-zhuh"),
    "ontem": ("ˈõtɐ̃j̃", "OHN-tayn"),
    "amanhã": ("ɐmɐˈɲɐ̃", "uh-muh-NYUNG"),
    "agora": ("ɐˈɡɔɾɐ", "uh-GAW-ruh"),
    "sempre": ("ˈsẽpɾɨ", "SEM-pruh"),
    "nunca": ("ˈnũkɐ", "NOON-kuh"),
    "bem": ("bɐ̃j̃", "bayn"),
    "mal": ("maɫ", "mahl"),
    "portugal": ("puɾtuˈɡaɫ", "poor-too-GAHL"),
    "lisboa": ("liʒˈboɐ", "leezh-BOH-uh"),
    "português": ("puɾtuˈɡeʃ", "poor-too-GESH"),
    "inglês": ("ĩˈɡleʃ", "een-GLESH"),
    "água": ("ˈaɡwɐ", "AH-gwuh"),
    "amigo": ("ɐˈmiɡu", "uh-MEE-goo"),
    "amiga": ("ɐˈmiɡɐ", "uh-MEE-guh"),
    "amigos": ("ɐˈmiɡuʃ", "uh-MEE-goosh"),
    "amigas": ("ɐˈmiɡɐʃ", "uh-MEE-gash"),
    "circular": ("siɾkuˈlaɾ", "seer-koo-LAHR"),
    "circulo": ("ˈsiɾkulu", "SEER-koo-loo"),
    "circulas": ("siɾˈkulɐʃ", "seer-KOO-lash"),
    "circula": ("siɾˈkulɐ", "seer-KOO-luh"),
    "circulamos": ("siɾkuˈlɐmuʃ", "seer-koo-LAH-moosh"),
    "circulam": ("siɾˈkulɐ̃w̃", "seer-KOO-lowng"),
}


def _strip_stress_marks_for_match(w: str) -> str:
    return w.lower().strip()


def _ipa_to_respell(ipa: str) -> str:
    """Map IPA (approx.) to an English-reader friendly respelling."""
    s = ipa
    reps = [
        ("ˈ", ""),
        ("ˌ", ""),
        ("ɐ̃w̃", "owng"),
        ("ɐ̃j̃", "ayn"),
        ("õj̃", "oyn"),
        ("ũj̃", "ooyn"),
        ("ɐ̃", "ung"),
        ("ẽ", "eng"),
        ("ĩ", "een"),
        ("õ", "ong"),
        ("ũ", "oon"),
        ("ɔ", "aw"),
        ("ɛ", "eh"),
        ("ɨ", "uh"),
        ("ɐ", "uh"),
        ("ʃ", "sh"),
        ("ʒ", "zh"),
        ("ʎ", "ly"),
        ("ɲ", "ny"),
        ("ʁ", "h"),
        ("ɾ", "r"),
        ("ɫ", "l"),
        ("ɡ", "g"),
        ("w", "w"),
        ("j", "y"),
        ("χ", "kh"),
        ("ː", ""),
    ]
    for a, b in reps:
        s = s.replace(a, b)
    # syllable-ish: split before vowels after consonant clusters — keep simple
    s = re.sub(r"\s+", "", s)
    # insert hyphens loosely between vowel-consonant-vowel
    out = []
    vowels = set("aeiouy")
    chars = list(s)
    for i, ch in enumerate(chars):
        out.append(ch)
        if i + 2 < len(chars):
            if ch.lower() not in vowels and chars[i + 1].lower() in vowels and i > 0:
                # don't over-hyphenate
                pass
    text = "".join(out)
    # Cap first chunk style: if long, hyphenate every 3-4 letters around vowels
    if len(text) >= 6 and "-" not in text:
        parts = re.findall(r"[^aeiouy]*[aeiouy]+[^aeiouy]*", text, flags=re.I)
        if len(parts) >= 2:
            text = "-".join(parts)
    return text or ipa


def _g2p_ep(word: str) -> str:
    """Very approximate EP grapheme→IPA (lowercase orthography)."""
    w = word.lower()
    # digraphs / multi-char first via placeholders
    reps = [
        ("ção", "sɐ̃w̃"),
        ("ções", "sõj̃ʃ"),
        ("chão", "ʃɐ̃w̃"),
        ("nh", "ɲ"),
        ("lh", "ʎ"),
        ("rr", "ʁ"),
        ("ss", "s"),
        ("ch", "ʃ"),
        ("qu", "k"),
        ("gu", "ɡ"),  # before e/i often; ok approx
        ("ãe", "ɐ̃j̃"),
        ("ão", "ɐ̃w̃"),
        ("õe", "õj̃"),
        ("ães", "ɐ̃j̃ʃ"),
        ("ões", "õj̃ʃ"),
        ("am", "ɐ̃w̃"),  # often word-final; applied later carefully
        ("em", "ɐ̃j̃"),
        ("en", "ẽ"),
        ("im", "ĩ"),
        ("om", "õ"),
        ("um", "ũ"),
        ("ns", "ʃ"),  # ends like bons ~ approx
    ]
    # manual scan
    i = 0
    out: list[str] = []
    n = len(w)
    while i < n:
        # multi
        hit = False
        for src, dst in [
            ("ções", "sõj̃ʃ"),
            ("ção", "sɐ̃w̃"),
            ("ões", "õj̃ʃ"),
            ("ães", "ɐ̃j̃ʃ"),
            ("ão", "ɐ̃w̃"),
            ("ãe", "ɐ̃j̃"),
            ("õe", "õj̃"),
            ("nh", "ɲ"),
            ("lh", "ʎ"),
            ("rr", "ʁ"),
            ("ss", "s"),
            ("ch", "ʃ"),
            ("qu", "k"),
            ("gu", "ɡ"),
            ("ex", "ɐjʃ"),  # e.g. exemplo rough
        ]:
            if w.startswith(src, i):
                out.append(dst)
                i += len(src)
                hit = True
                break
        if hit:
            continue
        ch = w[i]
        nxt = w[i + 1] if i + 1 < n else ""
        # word-final nasal endings
        if i == n - 2 and w[i : i + 2] in ("am", "em", "im", "om", "um"):
            out.append({"am": "ɐ̃w̃", "em": "ɐ̃j̃", "im": "ĩ", "om": "õ", "um": "ũ"}[w[i : i + 2]])
            i += 2
            continue
        if ch == "c" and nxt in "eiéíê":
            out.append("s")
        elif ch == "c":
            out.append("k")
        elif ch == "ç":
            out.append("s")
        elif ch == "g" and nxt in "eiéíê":
            out.append("ʒ")
        elif ch == "g":
            out.append("ɡ")
        elif ch == "j":
            out.append("ʒ")
        elif ch == "x":
            out.append("ʃ")
        elif ch == "s":
            # between vowels → z; final → ʃ; else s
            prev = w[i - 1] if i else ""
            if i == n - 1:
                out.append("ʃ")
            elif prev in "aeiouáàâãéêíóôõú" and nxt in "aeiouáàâãéêíóôõú":
                out.append("z")
            else:
                out.append("s")
        elif ch == "r":
            out.append("ʁ" if i == 0 else "ɾ")
        elif ch == "h":
            pass  # silent
        elif ch == "á" or ch == "à":
            out.append("a")
        elif ch == "â":
            out.append("ɐ")
        elif ch == "ã":
            out.append("ɐ̃")
        elif ch == "é":
            out.append("ɛ")
        elif ch == "ê":
            out.append("e")
        elif ch == "í":
            out.append("i")
        elif ch == "ó":
            out.append("ɔ")
        elif ch == "ô":
            out.append("o")
        elif ch == "õ":
            out.append("õ")
        elif ch == "ú":
            out.append("u")
        elif ch == "a":
            out.append("ɐ" if i != 0 and i != n - 1 else "a")
        elif ch == "e":
            out.append("ɨ" if i != 0 else "ɨ")
        elif ch == "i":
            out.append("i")
        elif ch == "o":
            out.append("u" if i == n - 1 else "o")
        elif ch == "u":
            out.append("u")
        elif ch == "y":
            out.append("i")
        elif ch == "b":
            out.append("b")
        elif ch == "d":
            out.append("d")
        elif ch == "f":
            out.append("f")
        elif ch == "k":
            out.append("k")
        elif ch == "l":
            out.append("ɫ" if i == n - 1 else "l")
        elif ch == "m":
            out.append("m")
        elif ch == "n":
            out.append("n")
        elif ch == "p":
            out.append("p")
        elif ch == "t":
            out.append("t")
        elif ch == "v":
            out.append("v")
        elif ch == "z":
            out.append("z")
        elif ch == "-":
            out.append("-")
        elif ch == "'":
            pass
        else:
            # strip combining marks fallback
            base = unicodedata.normalize("NFD", ch)
            base = "".join(c for c in base if unicodedata.category(c) != "Mn")
            out.append(base if base.isalpha() else "")
        i += 1
    ipa = "".join(out)
    # light stress: mark first vowel if word long
    if "ˈ" not in ipa and len(w) >= 4:
        m = re.search(r"[aeiouɛɔɨɐũĩõẽ]", ipa)
        if m and m.start() > 0:
            ipa = ipa[: m.start()] + "ˈ" + ipa[m.start() :]
        elif m and m.start() == 0 and len(ipa) > 3:
            # stress later syllable if possible
            ms = list(re.finditer(r"[aeiouɛɔɨɐ]", ipa))
            if len(ms) >= 2:
                pos = ms[-2].start()
                ipa = ipa[:pos] + "ˈ" + ipa[pos:]
    return ipa


def pronounce(word: str) -> tuple[str, str] | None:
    """Return (ipa, respelling) or None if empty."""
    w = _strip_stress_marks_for_match(word)
    if not w or not re.search(r"[A-Za-zÀ-ÿ]", w):
        return None
    if w in OVERRIDES:
        return OVERRIDES[w]
    # try without punctuation
    w2 = re.sub(r"[^A-Za-zÀ-ÿ']+", "", w)
    if w2 in OVERRIDES:
        return OVERRIDES[w2]
    ipa = _g2p_ep(w2)
    if not ipa:
        return None
    return ipa, _ipa_to_respell(ipa)
