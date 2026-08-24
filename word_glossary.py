# -*- coding: utf-8 -*-
"""
PT→EN hover glossary: gloss, part of speech, and gender/number morphology.

Non-verb sentence vocabulary is curated. Verb forms are filled from conjugation rows.
"""
from __future__ import annotations

from typing import Any

# Fields used in tips:
#   en, pos, gender, number, lemma, masc, fem, masc_pl, fem_pl, note
# gender: masculine | feminine | common
# number: singular | plural

Lex = dict[str, Any]

# --- helpers to build regular noun/adj paradigms ---------------------------------

def _n(
    en: str,
    *,
    gender: str,
    lemma: str,
    fem: str | None = None,
    masc: str | None = None,
    masc_pl: str | None = None,
    fem_pl: str | None = None,
    number: str = "singular",
    note: str = "",
    pos: str = "n.",
) -> Lex:
    d: Lex = {"en": en, "pos": pos, "gender": gender, "number": number, "lemma": lemma}
    if masc:
        d["masc"] = masc
    if fem:
        d["fem"] = fem
    if masc_pl:
        d["masc_pl"] = masc_pl
    if fem_pl:
        d["fem_pl"] = fem_pl
    if note:
        d["note"] = note
    return d


def _adj(
    en: str,
    *,
    gender: str,
    lemma: str,
    fem: str | None = None,
    masc: str | None = None,
    masc_pl: str | None = None,
    fem_pl: str | None = None,
    number: str = "singular",
    note: str = "",
) -> Lex:
    return _n(
        en,
        gender=gender,
        lemma=lemma,
        fem=fem,
        masc=masc,
        masc_pl=masc_pl,
        fem_pl=fem_pl,
        number=number,
        note=note,
        pos="adj.",
    )


def _pair(en: str, masc: str, fem: str, masc_pl: str, fem_pl: str) -> dict[str, Lex]:
    """Register all four gender/number forms for a regular noun."""
    return {
        masc: _n(en, gender="masculine", lemma=masc, fem=fem, masc_pl=masc_pl, fem_pl=fem_pl),
        fem: _n(en, gender="feminine", lemma=masc, masc=masc, fem=fem, masc_pl=masc_pl, fem_pl=fem_pl),
        masc_pl: _n(
            en,
            gender="masculine",
            lemma=masc,
            number="plural",
            fem=fem,
            masc=masc,
            masc_pl=masc_pl,
            fem_pl=fem_pl,
        ),
        fem_pl: _n(
            en,
            gender="feminine",
            lemma=masc,
            number="plural",
            fem=fem,
            masc=masc,
            masc_pl=masc_pl,
            fem_pl=fem_pl,
        ),
    }


def _adj_pair(en: str, masc: str, fem: str, masc_pl: str, fem_pl: str) -> dict[str, Lex]:
    return {
        masc: _adj(en, gender="masculine", lemma=masc, fem=fem, masc_pl=masc_pl, fem_pl=fem_pl),
        fem: _adj(en, gender="feminine", lemma=masc, masc=masc, fem=fem, masc_pl=masc_pl, fem_pl=fem_pl),
        masc_pl: _adj(
            en,
            gender="masculine",
            lemma=masc,
            number="plural",
            fem=fem,
            masc=masc,
            masc_pl=masc_pl,
            fem_pl=fem_pl,
        ),
        fem_pl: _adj(
            en,
            gender="feminine",
            lemma=masc,
            number="plural",
            fem=fem,
            masc=masc,
            masc_pl=masc_pl,
            fem_pl=fem_pl,
        ),
    }


CORE: dict[str, Lex] = {}

# People / nouns with full paradigms
CORE.update(_pair("friend", "amigo", "amiga", "amigos", "amigas"))
CORE.update(_pair("teacher", "professor", "professora", "professores", "professoras"))
CORE.update(_pair("neighbour", "vizinho", "vizinha", "vizinhos", "vizinhas"))
CORE.update(_pair("student", "estudante", "estudante", "estudantes", "estudantes"))
# estudante is common gender - override
CORE["estudante"] = _n(
    "student",
    gender="common",
    lemma="estudante",
    fem="estudante",
    masc="estudante",
    masc_pl="estudantes",
    fem_pl="estudantes",
    note="same form for masculine and feminine",
)
CORE["estudantes"] = _n(
    "student",
    gender="common",
    lemma="estudante",
    number="plural",
    fem="estudante",
    masc="estudante",
    masc_pl="estudantes",
    fem_pl="estudantes",
    note="same form for masculine and feminine",
)
CORE.update(_pair("brother", "irmão", "irmã", "irmãos", "irmãs"))
CORE.update(_adj_pair("nice / friendly", "simpático", "simpática", "simpáticos", "simpáticas"))
CORE.update(_adj_pair("tired", "cansado", "cansada", "cansados", "cansadas"))
CORE.update(_adj_pair("new", "novo", "nova", "novos", "novas"))
CORE.update(_adj_pair("small", "pequeno", "pequena", "pequenos", "pequenas"))
CORE.update(_adj_pair("public", "público", "pública", "públicos", "públicas"))
CORE.update(_adj_pair("long", "longo", "longa", "longos", "longas"))
CORE.update(_adj_pair("medium", "médio", "média", "médios", "médias"))
CORE.update(
    _adj_pair("specialized / specialist", "especializado", "especializada", "especializados", "especializadas")
)
CORE.update(_adj_pair("structural", "estrutural", "estrutural", "estruturais", "estruturais"))
CORE.update(_adj_pair("institutional", "institucional", "institucional", "institucionais", "institucionais"))
CORE.update(_adj_pair("professional", "profissional", "profissional", "profissionais", "profissionais"))
CORE.update(_adj_pair("social", "social", "social", "sociais", "sociais"))
CORE.update(_adj_pair("complex", "complexo", "complexa", "complexos", "complexas"))
CORE.update(_adj_pair("economic", "económico", "económica", "económicos", "económicas"))
CORE.update(_adj_pair("normative", "normativo", "normativa", "normativos", "normativas"))
CORE.update(_adj_pair("contemporary", "contemporâneo", "contemporânea", "contemporâneos", "contemporâneas"))
CORE.update(_adj_pair("analytical", "analítico", "analítica", "analíticos", "analíticas"))
CORE.update(_adj_pair("unequivocal", "inequívoco", "inequívoca", "inequívocos", "inequívocas"))
CORE.update(_adj_pair("sustained", "sustentado", "sustentada", "sustentados", "sustentadas"))
CORE.update(_adj_pair("interdisciplinary", "interdisciplinar", "interdisciplinar", "interdisciplinares", "interdisciplinares"))
CORE.update(_adj_pair("diachronic", "diacrónico", "diacrónica", "diacrónicos", "diacrónicas"))
CORE.update(_adj_pair("responsible", "responsável", "responsável", "responsáveis", "responsáveis"))

# Invariant / single-form entries
CORE.update(
    {
        # articles / determiners
        "o": {"en": "the", "pos": "art.", "gender": "masculine", "number": "singular", "lemma": "o", "fem": "a", "masc_pl": "os", "fem_pl": "as"},
        "a": {"en": "the / to / her", "pos": "art./prep./pron.", "gender": "feminine", "number": "singular", "lemma": "a", "masc": "o", "note": "article “the”; also prep. “to” / pronoun “her”"},
        "os": {"en": "the", "pos": "art.", "gender": "masculine", "number": "plural", "lemma": "o", "fem": "a", "masc": "o", "fem_pl": "as"},
        "as": {"en": "the", "pos": "art.", "gender": "feminine", "number": "plural", "lemma": "a", "masc": "o", "fem": "a", "masc_pl": "os"},
        "um": {"en": "a / one", "pos": "art./num.", "gender": "masculine", "number": "singular", "lemma": "um", "fem": "uma"},
        "uma": {"en": "a / one", "pos": "art./num.", "gender": "feminine", "number": "singular", "lemma": "um", "masc": "um"},
        "meu": {"en": "my", "pos": "det.", "gender": "masculine", "number": "singular", "lemma": "meu", "fem": "minha", "masc_pl": "meus", "fem_pl": "minhas"},
        "minha": {"en": "my", "pos": "det.", "gender": "feminine", "number": "singular", "lemma": "meu", "masc": "meu", "masc_pl": "meus", "fem_pl": "minhas"},
        "meus": {"en": "my", "pos": "det.", "gender": "masculine", "number": "plural", "lemma": "meu", "fem": "minha", "masc": "meu", "fem_pl": "minhas"},
        "muitas": {"en": "many", "pos": "det./pron.", "gender": "feminine", "number": "plural", "lemma": "muito", "masc": "muitos", "fem": "muita", "masc_pl": "muitos"},
        "muito": {"en": "very / a lot / much", "pos": "adv./det.", "lemma": "muito"},
        "mais": {"en": "more", "pos": "adv./det.", "lemma": "mais"},
        "todos": {"en": "all / every", "pos": "det./pron.", "gender": "masculine", "number": "plural", "lemma": "todo", "fem": "toda", "fem_pl": "todas", "masc": "todo"},
        "outros": {"en": "other", "pos": "det./pron.", "gender": "masculine", "number": "plural", "lemma": "outro", "fem": "outra", "fem_pl": "outras", "masc": "outro"},
        "este": {"en": "this", "pos": "det.", "gender": "masculine", "number": "singular", "lemma": "este", "fem": "esta"},
        "esta": {"en": "this", "pos": "det.", "gender": "feminine", "number": "singular", "lemma": "este", "masc": "este"},
        "isto": {"en": "this (thing)", "pos": "pron.", "lemma": "isto", "note": "neuter demonstrative"},
        "tudo": {"en": "everything / all", "pos": "pron.", "lemma": "tudo"},
        # pronouns
        "eu": {"en": "I", "pos": "pron.", "lemma": "eu"},
        "tu": {"en": "you (singular, informal)", "pos": "pron.", "lemma": "tu"},
        "ele": {"en": "he / him", "pos": "pron.", "gender": "masculine", "number": "singular", "lemma": "ele", "fem": "ela"},
        "ela": {"en": "she / her", "pos": "pron.", "gender": "feminine", "number": "singular", "lemma": "ele", "masc": "ele"},
        "eles": {"en": "they / them", "pos": "pron.", "gender": "masculine", "number": "plural", "lemma": "ele", "fem": "elas", "fem_pl": "elas"},
        "nós": {"en": "we / us", "pos": "pron.", "lemma": "nós"},
        "vocês": {"en": "you (plural)", "pos": "pron.", "lemma": "vocês"},
        # prepositions / contractions
        "de": {"en": "of / from", "pos": "prep.", "lemma": "de"},
        "em": {"en": "in / on / at", "pos": "prep.", "lemma": "em"},
        "com": {"en": "with", "pos": "prep.", "lemma": "com"},
        "sem": {"en": "without", "pos": "prep.", "lemma": "sem"},
        "sobre": {"en": "about / on / over", "pos": "prep.", "lemma": "sobre"},
        "para": {"en": "for / to", "pos": "prep.", "lemma": "para"},
        "por": {"en": "by / for / through", "pos": "prep.", "lemma": "por"},
        "no": {"en": "in/on the", "pos": "prep.+art.", "gender": "masculine", "number": "singular", "lemma": "em+o", "note": "em + o", "fem": "na"},
        "na": {"en": "in/on the", "pos": "prep.+art.", "gender": "feminine", "number": "singular", "lemma": "em+a", "note": "em + a", "masc": "no"},
        "nos": {"en": "in/on the", "pos": "prep.+art.", "gender": "masculine", "number": "plural", "lemma": "em+os", "note": "em + os"},
        "nas": {"en": "in/on the", "pos": "prep.+art.", "gender": "feminine", "number": "plural", "lemma": "em+as", "note": "em + as"},
        "do": {"en": "of/from the", "pos": "prep.+art.", "gender": "masculine", "number": "singular", "lemma": "de+o", "note": "de + o", "fem": "da"},
        "da": {"en": "of/from the", "pos": "prep.+art.", "gender": "feminine", "number": "singular", "lemma": "de+a", "note": "de + a", "masc": "do"},
        "ao": {"en": "to the", "pos": "prep.+art.", "gender": "masculine", "number": "singular", "lemma": "a+o", "note": "a + o", "fem": "à"},
        "à": {"en": "to the", "pos": "prep.+art.", "gender": "feminine", "number": "singular", "lemma": "a+a", "note": "a + a", "masc": "ao"},
        "às": {"en": "to the / at (time)", "pos": "prep.+art.", "gender": "feminine", "number": "plural", "lemma": "a+as", "note": "a + as"},
        "neste": {"en": "in this", "pos": "prep.+det.", "gender": "masculine", "number": "singular", "lemma": "em+este", "note": "em + este", "fem": "nesta"},
        "deste": {"en": "of/from this", "pos": "prep.+det.", "gender": "masculine", "number": "singular", "lemma": "de+este", "note": "de + este"},
        "daqui": {"en": "from here", "pos": "adv.", "lemma": "daqui", "note": "de + aqui"},
        # conjunctions / adverbs
        "e": {"en": "and", "pos": "conj.", "lemma": "e"},
        "ou": {"en": "or", "pos": "conj.", "lemma": "ou"},
        "mas": {"en": "but", "pos": "conj.", "lemma": "mas"},
        "se": {"en": "if / oneself", "pos": "conj./pron.", "lemma": "se"},
        "já": {"en": "already / now", "pos": "adv.", "lemma": "já"},
        "ainda": {"en": "still / yet", "pos": "adv.", "lemma": "ainda"},
        "também": {"en": "also / too", "pos": "adv.", "lemma": "também"},
        "sempre": {"en": "always", "pos": "adv.", "lemma": "sempre"},
        "quase": {"en": "almost", "pos": "adv.", "lemma": "quase"},
        "agora": {"en": "now", "pos": "adv.", "lemma": "agora"},
        "hoje": {"en": "today", "pos": "adv.", "lemma": "hoje"},
        "amanhã": {"en": "tomorrow", "pos": "adv.", "lemma": "amanhã"},
        "depois": {"en": "after / later", "pos": "adv./prep.", "lemma": "depois"},
        "aqui": {"en": "here", "pos": "adv.", "lemma": "aqui"},
        "fora": {"en": "outside", "pos": "adv.", "lemma": "fora"},
        "perto": {"en": "near / close", "pos": "adv./adj.", "lemma": "perto"},
        "bem": {"en": "well / fine", "pos": "adv.", "lemma": "bem"},
        "pouco": {"en": "a little / few", "pos": "adv./det.", "lemma": "pouco"},
        "depressa": {"en": "quickly", "pos": "adv.", "lemma": "depressa"},
        "normalmente": {"en": "normally / usually", "pos": "adv.", "lemma": "normalmente"},
        "recentemente": {"en": "recently", "pos": "adv.", "lemma": "recentemente"},
        "actualmente": {"en": "currently", "pos": "adv.", "lemma": "actualmente", "note": "EP spelling (EN: currently)"},
        "claramente": {"en": "clearly", "pos": "adv.", "lemma": "claramente"},
        "relativamente": {"en": "relatively", "pos": "adv.", "lemma": "relativamente"},
        "sistematicamente": {"en": "systematically", "pos": "adv.", "lemma": "sistematicamente"},
        "historicamente": {"en": "historically", "pos": "adv.", "lemma": "historicamente"},
        "contemporaneamente": {"en": "contemporaneously", "pos": "adv.", "lemma": "contemporaneamente"},
        "criticamente": {"en": "critically", "pos": "adv.", "lemma": "criticamente"},
        "durante": {"en": "during", "pos": "prep.", "lemma": "durante"},
        "juntos": {"en": "together", "pos": "adv./adj.", "gender": "masculine", "number": "plural", "lemma": "junto", "fem": "juntas", "note": "often used adverbially"},
        # time / place nouns
        "tempo": _n("time / weather", gender="masculine", lemma="tempo", masc_pl="tempos"),
        "momento": _n("moment", gender="masculine", lemma="momento", masc_pl="momentos"),
        "dia": _n("day", gender="masculine", lemma="dia", masc_pl="dias"),
        "dias": _n("day", gender="masculine", lemma="dia", number="plural", masc="dia", masc_pl="dias"),
        "manhã": _n("morning", gender="feminine", lemma="manhã", fem_pl="manhãs"),
        "tarde": _n("afternoon / late", gender="feminine", lemma="tarde", fem_pl="tardes", note="also adv. “late”"),
        "noite": _n("night", gender="feminine", lemma="noite", fem_pl="noites"),
        "semana": _n("week", gender="feminine", lemma="semana", fem_pl="semanas"),
        "ano": _n("year", gender="masculine", lemma="ano", masc_pl="anos"),
        "vezes": _n("time (occasion)", gender="feminine", lemma="vez", number="plural", fem="vez", fem_pl="vezes"),
        "fim": _n("end", gender="masculine", lemma="fim", masc_pl="fins"),
        "prazo": _n("deadline / term", gender="masculine", lemma="prazo", masc_pl="prazos"),
        "período": _n("period", gender="masculine", lemma="período", masc_pl="períodos"),
        "décadas": _n("decade", gender="feminine", lemma="década", number="plural", fem="década", fem_pl="décadas"),
        "últimas": _adj("last / latest", gender="feminine", lemma="último", number="plural", masc="último", fem="última", masc_pl="últimos", fem_pl="últimas"),
        "casa": _n("house / home", gender="feminine", lemma="casa", fem_pl="casas"),
        "escola": _n("school", gender="feminine", lemma="escola", fem_pl="escolas"),
        "cidade": _n("city", gender="feminine", lemma="cidade", fem_pl="cidades"),
        "rua": _n("street", gender="feminine", lemma="rua", fem_pl="ruas"),
        "bairro": _n("neighbourhood", gender="masculine", lemma="bairro", masc_pl="bairros"),
        "centro": _n("centre", gender="masculine", lemma="centro", masc_pl="centros"),
        "café": _n("coffee / café", gender="masculine", lemma="café", masc_pl="cafés"),
        "trabalho": _n("work / job", gender="masculine", lemma="trabalho", masc_pl="trabalhos"),
        "empresa": _n("company", gender="feminine", lemma="empresa", fem_pl="empresas"),
        "universidade": _n("university", gender="feminine", lemma="universidade", fem_pl="universidades"),
        "ginásio": _n("gym", gender="masculine", lemma="ginásio", masc_pl="ginásios"),
        "parque": _n("park", gender="masculine", lemma="parque", masc_pl="parques"),
        "cinema": _n("cinema / movies", gender="masculine", lemma="cinema", masc_pl="cinemas"),
        "mercado": _n("market", gender="masculine", lemma="mercado", masc_pl="mercados"),
        "região": _n("region", gender="feminine", lemma="região", fem_pl="regiões"),
        "estrangeiro": _n("abroad / foreigner", gender="masculine", lemma="estrangeiro", fem="estrangeira", masc_pl="estrangeiros", fem_pl="estrangeiras", note="“no estrangeiro” = abroad"),
        "portugal": {"en": "Portugal", "pos": "prop.n.", "lemma": "Portugal"},
        "lisboa": {"en": "Lisbon", "pos": "prop.n.", "lemma": "Lisboa"},
        "ana": {"en": "Ana (woman’s name)", "pos": "prop.n.", "lemma": "Ana"},
        "joão": {"en": "João (man’s name)", "pos": "prop.n.", "lemma": "João"},
        "beira": _n("edge / shore", gender="feminine", lemma="beira", fem_pl="beiras", note="in “à beira-mar” = by the seaside"),
        "mar": _n("sea", gender="masculine", lemma="mar", masc_pl="mares"),
        "ambiente": _n("environment / setting", gender="masculine", lemma="ambiente", masc_pl="ambientes"),
        "ambientes": _n("environment / setting", gender="masculine", lemma="ambiente", number="plural", masc="ambiente", masc_pl="ambientes"),
        "âmbito": _n("scope / sphere", gender="masculine", lemma="âmbito", masc_pl="âmbitos"),
        "esfera": _n("sphere", gender="feminine", lemma="esfera", fem_pl="esferas"),
        "organização": _n("organisation", gender="feminine", lemma="organização", fem_pl="organizações"),
        "administração": _n("administration", gender="feminine", lemma="administração", fem_pl="administrações"),
        "comunidade": _n("community", gender="feminine", lemma="comunidade", fem_pl="comunidades"),
        "sociedade": _n("society", gender="feminine", lemma="sociedade", fem_pl="sociedades"),
        "sector": _n("sector", gender="masculine", lemma="sector", masc_pl="sectores", note="EP spelling"),
        "tecido": _n("fabric / tissue / fabric (fig.)", gender="masculine", lemma="tecido", masc_pl="tecidos"),
        "discurso": _n("discourse / speech", gender="masculine", lemma="discurso", masc_pl="discursos"),
        "práxis": _n("praxis / practice", gender="feminine", lemma="práxis", note="invariable plural often same"),
        "contexto": _n("context", gender="masculine", lemma="contexto", masc_pl="contextos"),
        "contextos": _n("context", gender="masculine", lemma="contexto", number="plural", masc="contexto", masc_pl="contextos"),
        # people groups
        "pais": _n("parents / country", gender="masculine", lemma="pai", number="plural", masc="pai", masc_pl="pais", note="“os pais” = parents; “o país” = country (accent)"),
        "família": _n("family", gender="feminine", lemma="família", fem_pl="famílias"),
        "mãe": _n("mother", gender="feminine", lemma="mãe", fem_pl="mães", masc="pai"),
        "colegas": _n("colleague", gender="common", lemma="colega", number="plural", masc="colega", fem="colega", masc_pl="colegas", fem_pl="colegas"),
        "cliente": _n("client / customer", gender="common", lemma="cliente", masc_pl="clientes", fem_pl="clientes", note="same form m/f"),
        "equipa": _n("team", gender="feminine", lemma="equipa", fem_pl="equipas"),
        "médico": _n("doctor", gender="masculine", lemma="médico", fem="médica", masc_pl="médicos", fem_pl="médicas"),
        "diretora": _n("director (f.)", gender="feminine", lemma="diretor", masc="diretor", fem="diretora", masc_pl="diretores", fem_pl="diretoras"),
        "especialistas": _n("specialist", gender="common", lemma="especialista", number="plural", masc_pl="especialistas", fem_pl="especialistas"),
        "parceiros": _n("partner", gender="masculine", lemma="parceiro", number="plural", masc="parceiro", fem="parceira", fem_pl="parceiras"),
        "responsáveis": _n("person in charge", gender="common", lemma="responsável", number="plural", masc_pl="responsáveis", fem_pl="responsáveis"),
        "intervenientes": _n("stakeholder / party involved", gender="common", lemma="interveniente", number="plural"),
        "decisores": _n("decision-maker", gender="masculine", lemma="decisor", number="plural", masc="decisor", fem="decisora", fem_pl="decisoras"),
        "agentes": _n("agent", gender="common", lemma="agente", number="plural"),
        "académicos": _n("academic", gender="masculine", lemma="académico", number="plural", masc="académico", fem="académica", fem_pl="académicas"),
        "formuladores": _n("formulator / policymaker", gender="masculine", lemma="formulador", number="plural", fem="formuladora", fem_pl="formuladoras"),
        "crítica": _n("criticism / critic (f.) / critical (f. adj.)", gender="feminine", lemma="crítica", masc="crítico", note="noun or adjective depending on context"),
        "civil": {"en": "civil", "pos": "adj.", "lemma": "civil", "note": "invariable for gender in singular"},
        "pessoas": _n("person / people", gender="feminine", lemma="pessoa", number="plural", fem="pessoa", fem_pl="pessoas"),
        # things
        "livro": _n("book", gender="masculine", lemma="livro", masc_pl="livros"),
        "água": _n("water", gender="feminine", lemma="água", fem_pl="águas"),
        "comida": _n("food", gender="feminine", lemma="comida", fem_pl="comidas"),
        "almoço": _n("lunch", gender="masculine", lemma="almoço", masc_pl="almoços"),
        "chá": _n("tea", gender="masculine", lemma="chá", masc_pl="chás"),
        "telemóvel": _n("mobile phone", gender="masculine", lemma="telemóvel", masc_pl="telemóveis"),
        "mesa": _n("table", gender="feminine", lemma="mesa", fem_pl="mesas"),
        "sofá": _n("sofa", gender="masculine", lemma="sofá", masc_pl="sofás"),
        "caixa": _n("box / till / checkout", gender="feminine", lemma="caixa", fem_pl="caixas"),
        "autocarro": _n("bus", gender="masculine", lemma="autocarro", masc_pl="autocarros"),
        "comboio": _n("train", gender="masculine", lemma="comboio", masc_pl="comboios"),
        "música": _n("music / song", gender="feminine", lemma="música", fem_pl="músicas"),
        "futebol": _n("football / soccer", gender="masculine", lemma="futebol"),
        "desporto": _n("sport", gender="masculine", lemma="desporto", masc_pl="desportos"),
        "português": {"en": "Portuguese (language / person)", "pos": "n./adj.", "gender": "masculine", "lemma": "português", "fem": "portuguesa", "masc_pl": "portugueses", "fem_pl": "portuguesas"},
        "inglês": {"en": "English (language / person)", "pos": "n./adj.", "gender": "masculine", "lemma": "inglês", "fem": "inglesa", "masc_pl": "ingleses", "fem_pl": "inglesas"},
        "viagens": _n("trip / travel", gender="feminine", lemma="viagem", number="plural", fem="viagem", fem_pl="viagens"),
        "fotografias": _n("photograph", gender="feminine", lemma="fotografia", number="plural", fem="fotografia", fem_pl="fotografias"),
        "notícias": _n("news", gender="feminine", lemma="notícia", number="plural", fem="notícia", fem_pl="notícias"),
        "mensagem": _n("message", gender="feminine", lemma="mensagem", fem_pl="mensagens"),
        "problema": _n("problem", gender="masculine", lemma="problema", masc_pl="problemas"),
        "resposta": _n("answer / reply", gender="feminine", lemma="resposta", fem_pl="respostas"),
        "reunião": _n("meeting", gender="feminine", lemma="reunião", fem_pl="reuniões"),
        "aula": _n("class / lesson", gender="feminine", lemma="aula", fem_pl="aulas"),
        "exercício": _n("exercise", gender="masculine", lemma="exercício", masc_pl="exercícios"),
        "dinheiro": _n("money", gender="masculine", lemma="dinheiro"),
        "fome": _n("hunger", gender="feminine", lemma="fome", note="“ter fome” = to be hungry"),
        "frio": _n("cold", gender="masculine", lemma="frio", fem="fria", note="noun or adjective"),
        "barulho": _n("noise", gender="masculine", lemma="barulho", masc_pl="barulhos"),
        "descanso": _n("rest", gender="masculine", lemma="descanso", masc_pl="descansos"),
        "descansar": {"en": "to rest", "pos": "v.", "lemma": "descansar", "note": "infinitive"},
        "apoio": _n("support", gender="masculine", lemma="apoio", masc_pl="apoios"),
        "ajuda": _n("help", gender="feminine", lemma="ajuda", fem_pl="ajudas"),
        "verdade": _n("truth", gender="feminine", lemma="verdade", fem_pl="verdades"),
        "ideia": _n("idea", gender="feminine", lemma="ideia", fem_pl="ideias"),
        "ideias": _n("idea", gender="feminine", lemma="ideia", number="plural", fem="ideia", fem_pl="ideias"),
        "coisas": _n("thing", gender="feminine", lemma="coisa", number="plural", fem="coisa", fem_pl="coisas"),
        "regra": _n("rule", gender="feminine", lemma="regra", fem_pl="regras"),
        "sistema": _n("system", gender="masculine", lemma="sistema", masc_pl="sistemas"),
        "plano": _n("plan", gender="masculine", lemma="plano", masc_pl="planos"),
        "planos": _n("plan", gender="masculine", lemma="plano", number="plural", masc="plano", masc_pl="planos"),
        "projecto": _n("project", gender="masculine", lemma="projecto", masc_pl="projectos", note="EP spelling"),
        "proposta": _n("proposal", gender="feminine", lemma="proposta", fem_pl="propostas"),
        "processo": _n("process", gender="masculine", lemma="processo", masc_pl="processos"),
        "estratégia": _n("strategy", gender="feminine", lemma="estratégia", fem_pl="estratégias"),
        "análise": _n("analysis", gender="feminine", lemma="análise", fem_pl="análises"),
        "impacto": _n("impact", gender="masculine", lemma="impacto", masc_pl="impactos"),
        "situação": _n("situation", gender="feminine", lemma="situação", fem_pl="situações"),
        "experiência": _n("experience", gender="feminine", lemma="experiência", fem_pl="experiências"),
        "relatório": _n("report", gender="masculine", lemma="relatório", masc_pl="relatórios"),
        "decisão": _n("decision", gender="feminine", lemma="decisão", fem_pl="decisões"),
        "abordagem": _n("approach", gender="feminine", lemma="abordagem", fem_pl="abordagens"),
        "dinâmica": _n("dynamics / dynamic", gender="feminine", lemma="dinâmica", fem_pl="dinâmicas"),
        "paradigma": _n("paradigm", gender="masculine", lemma="paradigma", masc_pl="paradigmas"),
        "dispositivo": _n("device / apparatus", gender="masculine", lemma="dispositivo", masc_pl="dispositivos"),
        "contingência": _n("contingency", gender="feminine", lemma="contingência", fem_pl="contingências"),
        "tensão": _n("tension", gender="feminine", lemma="tensão", fem_pl="tensões"),
        "mediação": _n("mediation", gender="feminine", lemma="mediação", fem_pl="mediações"),
        "mediações": _n("mediation", gender="feminine", lemma="mediação", number="plural", fem="mediação", fem_pl="mediações"),
        "quadro": _n("framework / picture / board", gender="masculine", lemma="quadro", masc_pl="quadros"),
        "política": _n("politics / policy / female politician", gender="feminine", lemma="política", masc="político"),
        "solução": _n("solution", gender="feminine", lemma="solução", fem_pl="soluções"),
        "soluções": _n("solution", gender="feminine", lemma="solução", number="plural", fem="solução", fem_pl="soluções"),
        "resultado": _n("result", gender="masculine", lemma="resultado", masc_pl="resultados"),
        "resultados": _n("result", gender="masculine", lemma="resultado", number="plural", masc="resultado", masc_pl="resultados"),
        "desafios": _n("challenge", gender="masculine", lemma="desafio", number="plural", masc="desafio", masc_pl="desafios"),
        "objectivos": _n("objective / goal", gender="masculine", lemma="objectivo", number="plural", masc="objectivo", masc_pl="objectivos", note="EP spelling"),
        "opiniões": _n("opinion", gender="feminine", lemma="opinião", number="plural", fem="opinião", fem_pl="opiniões"),
        "critérios": _n("criterion", gender="masculine", lemma="critério", number="plural", masc="critério", masc_pl="critérios"),
        "recursos": _n("resource", gender="masculine", lemma="recurso", number="plural", masc="recurso", masc_pl="recursos"),
        "prioridades": _n("priority", gender="feminine", lemma="prioridade", number="plural", fem="prioridade", fem_pl="prioridades"),
        "tendências": _n("trend", gender="feminine", lemma="tendência", number="plural", fem="tendência", fem_pl="tendências"),
        "implicações": _n("implication", gender="feminine", lemma="implicação", number="plural", fem="implicação", fem_pl="implicações"),
        "pressupostos": _n("assumption / premise", gender="masculine", lemma="pressuposto", number="plural", masc="pressuposto", masc_pl="pressupostos"),
        "perspectivas": _n("perspective / outlook", gender="feminine", lemma="perspectiva", number="plural", fem="perspectiva", fem_pl="perspectivas"),
        "mecanismos": _n("mechanism", gender="masculine", lemma="mecanismo", number="plural", masc="mecanismo", masc_pl="mecanismos"),
        "epistemologias": _n("epistemology", gender="feminine", lemma="epistemologia", number="plural", fem="epistemologia", fem_pl="epistemologias"),
        "configurações": _n("configuration", gender="feminine", lemma="configuração", number="plural", fem="configuração", fem_pl="configurações"),
        "reconfigurações": _n("reconfiguration", gender="feminine", lemma="reconfiguração", number="plural", fem="reconfiguração", fem_pl="reconfigurações"),
        "papéis": _n("role / paper", gender="masculine", lemma="papel", number="plural", masc="papel", masc_pl="papéis"),
        "tarefas": _n("task", gender="feminine", lemma="tarefa", number="plural", fem="tarefa", fem_pl="tarefas"),
        "móveis": _n("furniture / piece of furniture", gender="masculine", lemma="móvel", number="plural", masc="móvel", masc_pl="móveis"),
        "atenção": _n("attention", gender="feminine", lemma="atenção"),
        "cuidado": _n("care / carefulness", gender="masculine", lemma="cuidado", note="“com cuidado” = carefully"),
        "calma": _n("calm", gender="feminine", lemma="calma", note="“com calma” = calmly"),
        "pressa": _n("hurry", gender="feminine", lemma="pressa", note="“sem pressa” = without hurry"),
        "rigor": _n("rigour / strictness", gender="masculine", lemma="rigor"),
        "consistência": _n("consistency", gender="feminine", lemma="consistência"),
        "profundidade": _n("depth", gender="feminine", lemma="profundidade"),
        "precisão": _n("precision", gender="feminine", lemma="precisão"),
        "frequência": _n("frequency", gender="feminine", lemma="frequência"),
        "conjunto": _n("set / together", gender="masculine", lemma="conjunto", note="“em conjunto” = jointly"),
        "detalhe": _n("detail", gender="masculine", lemma="detalhe", masc_pl="detalhes"),
        "modo": _n("way / mode", gender="masculine", lemma="modo", masc_pl="modos"),
        "forma": _n("form / way", gender="feminine", lemma="forma", fem_pl="formas"),
        "eficaz": {"en": "effective", "pos": "adj.", "lemma": "eficaz", "note": "same form m/f singular; plural eficazes"},
        "paralelo": _n("parallel", gender="masculine", lemma="paralelo", note="“em paralelo” = in parallel"),
        "simultâneo": _adj("simultaneous", gender="masculine", lemma="simultâneo", fem="simultânea", masc_pl="simultâneos", fem_pl="simultâneas"),
        "contínuo": _adj("continuous", gender="masculine", lemma="contínuo", fem="contínua", masc_pl="contínuos", fem_pl="contínuas"),
        "presente": _n("present / gift", gender="masculine", lemma="presente", note="also adj. “present”"),
        "termos": _n("term", gender="masculine", lemma="termo", number="plural", masc="termo", masc_pl="termos", note="“em termos” = in terms"),
        "dois": {"en": "two", "pos": "num.", "gender": "masculine", "lemma": "dois", "fem": "duas"},
        "vor": {"en": "(possible typo)", "pos": "?", "lemma": "vor", "note": "not a standard word in these examples"},
    }
)

PERSON_LABEL = {
    "eu": "1st person singular (eu)",
    "tu": "2nd person singular (tu)",
    "ele": "3rd person singular (ele/ela)",
    "nos": "1st person plural (nós)",
    "eles": "3rd person plural (eles/elas/vocês)",
    "inf": "infinitive",
}


def format_tip(word: str, entry: Lex) -> str:
    """Plain-text tip lines for the hover bubble."""
    en = entry.get("en", "")
    pos = entry.get("pos", "")
    is_verbish = pos == "v." or str(pos).startswith("v./")
    lines = [f"{word}", f"{en} ({pos})" if pos else en]

    morph_bits: list[str] = []
    gender = entry.get("gender")
    number = entry.get("number")
    if gender and number:
        morph_bits.append(f"{gender} {number}")
    elif gender:
        morph_bits.append(str(gender))
    elif number:
        morph_bits.append(str(number))

    lemma = entry.get("lemma")
    if lemma and lemma.lower() != word.lower() and not is_verbish:
        morph_bits.append(f"of {lemma}")

    if entry.get("form"):
        morph_bits.append(str(entry["form"]))
    if entry.get("infinitive") and is_verbish:
        morph_bits.append(f"of {entry['infinitive']}")

    if morph_bits:
        lines.append(" · ".join(morph_bits))

    alts: list[str] = []
    wl = word.lower()
    lemma_l = (lemma or "").lower()

    fem = entry.get("fem")
    masc = entry.get("masc")
    fem_pl = entry.get("fem_pl")
    masc_pl = entry.get("masc_pl")

    # Cross-gender / number forms (skip forms identical to the hovered word)
    if fem and fem.lower() != wl:
        alts.append(f"feminine: {fem}")
    if masc and masc.lower() != wl and (masc.lower() != lemma_l or gender == "feminine"):
        alts.append(f"masculine: {masc}")

    if number == "plural":
        if gender == "masculine" and fem_pl and fem_pl.lower() != wl:
            alts.append(f"feminine plural: {fem_pl}")
        if gender == "feminine" and masc_pl and masc_pl.lower() != wl:
            alts.append(f"masculine plural: {masc_pl}")
    else:
        if gender == "masculine" and masc_pl and masc_pl.lower() != wl:
            alts.append(f"plural: {masc_pl}")
        elif gender == "feminine":
            if masc_pl and masc_pl.lower() != wl and masc_pl != fem_pl:
                alts.append(f"masculine plural: {masc_pl}")
            if fem_pl and fem_pl.lower() != wl:
                alts.append(f"plural: {fem_pl}")
        elif gender == "common" and masc_pl and masc_pl.lower() != wl:
            alts.append(f"plural: {masc_pl}")

    if alts:
        seen: set[str] = set()
        clean = []
        for a in alts:
            if a not in seen:
                seen.add(a)
                clean.append(a)
        lines.append(" · ".join(clean))

    if entry.get("note"):
        lines.append(str(entry["note"]))
    return "\n".join(lines)


def build_glossary(rows: list[dict[str, str]]) -> dict[str, Lex]:
    """Merge curated CORE with all verb forms from conjugation rows."""
    gloss: dict[str, Lex] = dict(CORE)

    for r in rows:
        inf = r["infinitive"]
        en = r["english"]
        gloss_en = en
        mapping = [
            ("inf", inf),
            ("eu", r["eu"]),
            ("tu", r["tu"]),
            ("ele", r["ele_ela"]),
            ("nos", r["nos"]),
            ("eles", r["eles_elas_voces"]),
        ]
        for person, form in mapping:
            key = form.lower()
            verb_entry: Lex = {
                "en": gloss_en,
                "pos": "v.",
                "lemma": inf,
                "form": PERSON_LABEL[person],
                "infinitive": inf,
            }
            existing = gloss.get(key)
            if existing and existing.get("pos") != "v." and key in CORE:
                # Homograph: keep both senses (e.g. para = stop / for)
                other_en = existing.get("en", "")
                other_pos = existing.get("pos", "")
                merged = dict(existing)
                merged["en"] = f"{gloss_en} ({PERSON_LABEL[person]} of {inf})  |  also: {other_en}"
                merged["pos"] = f"v./{other_pos}"
                merged["form"] = PERSON_LABEL[person]
                merged["infinitive"] = inf
                merged["lemma"] = inf
                note_bits = []
                if existing.get("note"):
                    note_bits.append(str(existing["note"]))
                note_bits.append("same spelling can be verb or non-verb depending on context")
                merged["note"] = " · ".join(note_bits)
                # keep gender/number from noun/prep sense for morphology lines
                gloss[key] = merged
            elif not existing or existing.get("pos") == "v.":
                gloss[key] = verb_entry
            else:
                gloss[key] = verb_entry
    return gloss


def tip_payload(gloss: dict[str, Lex]) -> dict[str, str]:
    """Compact word → tip text map for embedding in HTML."""
    return {w: format_tip(w, e) for w, e in gloss.items()}
