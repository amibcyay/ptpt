# -*- coding: utf-8 -*-
"""CEFR-leveled sample sentences for each present-tense conjugation."""
from __future__ import annotations

import hashlib

VOCAB = {
    "A1": {
        "place": ["em casa", "na escola", "no café", "aqui", "em Lisboa"],
        "time": ["hoje", "agora", "todos os dias", "de manhã", "à noite"],
        "person": ["o meu amigo", "a Ana", "o João", "a minha mãe", "o professor"],
        "thing": ["o livro", "o café", "a água", "o telemóvel", "a comida"],
        "adv": ["bem", "muito", "um pouco", "sempre", "também"],
        "obj": ["português", "música", "futebol", "cinema", "chá"],
    },
    "A2": {
        "place": ["no centro", "no trabalho", "na cidade", "em Portugal", "no ginásio"],
        "time": ["esta semana", "no fim de semana", "à tarde", "às vezes", "normalmente"],
        "person": ["os meus pais", "a minha família", "os colegas", "o vizinho", "a professora"],
        "thing": ["o comboio", "a reunião", "a mensagem", "o problema", "a resposta"],
        "adv": ["quase sempre", "ainda", "já", "depressa", "com cuidado"],
        "obj": ["inglês", "desporto", "viagens", "fotografias", "notícias"],
    },
    "B1": {
        "place": ["na empresa", "no estrangeiro", "na universidade", "no bairro", "à beira-mar"],
        "time": ["recentemente", "durante a semana", "há pouco", "com frequência", "neste momento"],
        "person": ["a equipa", "o cliente", "os estudantes", "o médico", "a diretora"],
        "thing": ["o projeto", "a situação", "a experiência", "o relatório", "a decisão"],
        "adv": ["claramente", "com calma", "em conjunto", "sem pressa", "com atenção"],
        "obj": ["opiniões", "resultados", "desafios", "objectivos", "planos"],
    },
    "B2": {
        "place": ["na organização", "no mercado", "na região", "em contexto profissional", "no sector público"],
        "time": ["actualmente", "ao longo do ano", "em paralelo", "a médio prazo", "neste período"],
        "person": ["os responsáveis", "os especialistas", "a administração", "os parceiros", "a comunidade"],
        "thing": ["a estratégia", "o processo", "a análise", "o impacto", "a proposta"],
        "adv": ["de forma eficaz", "com rigor", "relativamente bem", "em detalhe", "com consistência"],
        "obj": ["critérios", "recursos", "prioridades", "tendências", "soluções"],
    },
    "C1": {
        "place": ["no âmbito institucional", "na esfera pública", "em ambientes complexos", "no tecido económico"],
        "time": ["contemporaneamente", "em simultâneo", "a longo prazo", "nas últimas décadas"],
        "person": ["os intervenientes", "os decisores", "a sociedade civil", "os académicos"],
        "thing": ["o quadro normativo", "a dinâmica", "a abordagem", "o paradigma"],
        "adv": ["de modo sustentado", "com profundidade", "de forma crítica", "sistematicamente"],
        "obj": ["implicações", "pressupostos", "perspectivas", "mecanismos"],
    },
    "C2": {
        "place": ["no discurso contemporâneo", "na práxis institucional", "em contextos interdisciplinares"],
        "time": ["historicamente", "em termos diacrónicos", "no presente contínuo"],
        "person": ["os agentes sociais", "os formuladores de política", "a crítica especializada"],
        "thing": ["a contingência", "a mediação", "o dispositivo", "a tensão estrutural"],
        "adv": ["de forma inequívoca", "com precisão analítica", "criticamente"],
        "obj": ["epistemologias", "configurações", "mediações", "reconfigurações"],
    },
}

GROUP_FAMILY = {
    "Being & existing": "state",
    "Becoming, changing & causing": "change",
    "Having, needing & ability": "modal",
    "Wanting, deciding & trying": "want",
    "Doing, working & using": "action",
    "Starting, stopping & continuing": "aspect",
    "Going, coming & traveling": "motion",
    "Moving the body & objects": "move",
    "Putting, taking & placing": "place",
    "Opening, closing & covering": "action",
    "Creating, building & destroying": "make",
    "Seeing & looking": "see",
    "Hearing & sensing": "sense",
    "Body, rest & daily routines": "body",
    "Eating & drinking": "eat",
    "Thinking & knowing": "think",
    "Learning, reading & writing": "learn",
    "Speaking & communicating": "speak",
    "Asking, answering & arguing": "speak",
    "Emotions & attitudes": "feel",
    "People, help & relationships": "social",
    "Finding, searching & waiting": "search",
    "Giving, receiving & exchanging": "give",
    "Money, buying & selling": "money",
    "Joining, separating & organizing": "org",
    "Measuring, checking & analyzing": "think",
    "Force, conflict & law": "force",
    "Allowing, forcing & controlling": "force",
    "Play, arts & leisure": "play",
}

SPECIAL: dict[str, dict[str, dict[str, str]]] = {
    "ser": {"A1": {
        "eu": "Eu sou estudante.", "tu": "Tu és muito simpático.",
        "ele": "Ela é de Lisboa.", "nos": "Nós somos amigos.", "eles": "Eles são professores.",
    }},
    "estar": {"A1": {
        "eu": "Eu estou em casa agora.", "tu": "Tu estás bem hoje?",
        "ele": "Ele está no café.", "nos": "Nós estamos cansados.", "eles": "Vocês estão aqui?",
    }},
    "haver": {"A1": {
        "eu": "Eu hei de ir amanhã.", "tu": "Tu hás de gostar deste livro.",
        "ele": "Há um café perto daqui.", "nos": "Nós havemos de falar depois.",
        "eles": "Há muitas pessoas na rua.",
    }},
    "ter": {"A1": {
        "eu": "Eu tenho um telemóvel novo.", "tu": "Tu tens tempo hoje?",
        "ele": "Ela tem dois irmãos.", "nos": "Nós temos aula de manhã.", "eles": "Eles têm fome.",
    }},
    "fazer": {"A1": {
        "eu": "Eu faço o pequeno-almoço.", "tu": "Tu fazes exercício?",
        "ele": "Ele faz o trabalho em casa.", "nos": "Nós fazemos a comida juntos.",
        "eles": "Eles fazem perguntas.",
    }},
    "ir": {"A1": {
        "eu": "Eu vou à escola.", "tu": "Tu vais ao cinema?",
        "ele": "Ela vai a casa.", "nos": "Nós vamos de autocarro.", "eles": "Eles vão ao parque.",
    }},
    "gostar": {"A1": {
        "eu": "Eu gosto de música.", "tu": "Tu gostas de café?",
        "ele": "Ele gosta de futebol.", "nos": "Nós gostamos de viajar.", "eles": "Eles gostam de cinema.",
    }},
    "precisar": {"A1": {
        "eu": "Eu preciso de ajuda.", "tu": "Tu precisas de água?",
        "ele": "Ela precisa de tempo.", "nos": "Nós precisamos de dinheiro.",
        "eles": "Eles precisam de descanso.",
    }},
    "poder": {"A1": {
        "eu": "Eu posso ajudar.", "tu": "Tu podes vir hoje?",
        "ele": "Ele pode falar português.", "nos": "Nós podemos esperar.", "eles": "Eles podem entrar.",
    }},
    "dever": {"A1": {
        "eu": "Eu devo estudar hoje.", "tu": "Tu deves comer mais.",
        "ele": "Ela deve chegar cedo.", "nos": "Nós devemos partir agora.", "eles": "Eles devem pagar.",
    }},
    "querer": {"A1": {
        "eu": "Eu quero um café.", "tu": "Tu queres ir ao cinema?",
        "ele": "Ele quer água.", "nos": "Nós queremos aprender.", "eles": "Eles querem descansar.",
    }},
}


def _pick(level: str, key: str, seed: str) -> str:
    pool = VOCAB.get(level, VOCAB["B1"])[key]
    h = int(hashlib.md5(seed.encode("utf-8")).hexdigest(), 16)
    return pool[h % len(pool)]


def _templates(family: str) -> dict[str, str]:
    complements = {
        "state": {
            "eu": "Eu {v} {place} {time}.",
            "tu": "Tu {v} {adv} {time}?",
            "ele": "Ele {v} {place}.",
            "nos": "Nós {v} {adv} {time}.",
            "eles": "Eles {v} {place} {time}.",
        },
        "motion": {
            "eu": "Eu {v} {place} {time}.",
            "tu": "Tu {v} {place} {adv}?",
            "ele": "Ela {v} {place} {time}.",
            "nos": "Nós {v} {place} juntos.",
            "eles": "Eles {v} {place} {time}.",
        },
        "speak": {
            "eu": "Eu {v} sobre {obj} {time}.",
            "tu": "Tu {v} {adv} com {person}.",
            "ele": "Ele {v} a verdade {time}.",
            "nos": "Nós {v} sobre {thing}.",
            "eles": "Eles {v} {adv} na reunião.",
        },
        "think": {
            "eu": "Eu {v} sobre {thing} {time}.",
            "tu": "Tu {v} {thing} {adv}?",
            "ele": "Ela {v} {obj} com cuidado.",
            "nos": "Nós {v} {thing} juntos.",
            "eles": "Eles {v} o problema {time}.",
        },
        "see": {
            "eu": "Eu {v} {thing} {place}.",
            "tu": "Tu {v} isto {adv}?",
            "ele": "Ele {v} {person} {time}.",
            "nos": "Nós {v} {obj} {adv}.",
            "eles": "Eles {v} tudo {place}.",
        },
        "sense": {
            "eu": "Eu {v} {thing} {adv}.",
            "tu": "Tu {v} a música {place}?",
            "ele": "Ela {v} frio {time}.",
            "nos": "Nós {v} o barulho {place}.",
            "eles": "Eles {v} {adv} o ambiente.",
        },
        "eat": {
            "eu": "Eu {v} {thing} {time}.",
            "tu": "Tu {v} {obj} {adv}?",
            "ele": "Ele {v} em casa {time}.",
            "nos": "Nós {v} juntos {place}.",
            "eles": "Eles {v} {thing} {adv}.",
        },
        "feel": {
            "eu": "Eu {v} isto {adv}.",
            "tu": "Tu {v} {person} {time}?",
            "ele": "Ela {v} a situação {adv}.",
            "nos": "Nós {v} {obj} de verdade.",
            "eles": "Eles {v} o apoio {place}.",
        },
        "modal": {
            "eu": "Eu {v} fazer isto {time}.",
            "tu": "Tu {v} vir {place}?",
            "ele": "Ele {v} estudar {adv}.",
            "nos": "Nós {v} resolver {thing}.",
            "eles": "Eles {v} esperar {time}.",
        },
        "want": {
            "eu": "Eu {v} {obj} {time}.",
            "tu": "Tu {v} ir {place}?",
            "ele": "Ela {v} {thing} agora.",
            "nos": "Nós {v} {obj} juntos.",
            "eles": "Eles {v} uma resposta {adv}.",
        },
        "give": {
            "eu": "Eu {v} {thing} a {person}.",
            "tu": "Tu {v} isto {adv}?",
            "ele": "Ele {v} ajuda {place}.",
            "nos": "Nós {v} tempo a {person}.",
            "eles": "Eles {v} {thing} {time}.",
        },
        "money": {
            "eu": "Eu {v} {thing} {time}.",
            "tu": "Tu {v} isto {place}?",
            "ele": "Ela {v} pouco {time}.",
            "nos": "Nós {v} {obj} com cuidado.",
            "eles": "Eles {v} {thing} {adv}.",
        },
        "search": {
            "eu": "Eu {v} {thing} {place}.",
            "tu": "Tu {v} {person} {time}?",
            "ele": "Ele {v} uma solução {adv}.",
            "nos": "Nós {v} {obj} juntos.",
            "eles": "Eles {v} o caminho {place}.",
        },
        "social": {
            "eu": "Eu {v} {person} {time}.",
            "tu": "Tu {v} os outros {adv}?",
            "ele": "Ela {v} a família {place}.",
            "nos": "Nós {v} {person} sempre.",
            "eles": "Eles {v} a comunidade {adv}.",
        },
        "learn": {
            "eu": "Eu {v} português {time}.",
            "tu": "Tu {v} {obj} {adv}?",
            "ele": "Ele {v} {thing} na escola.",
            "nos": "Nós {v} juntos {place}.",
            "eles": "Eles {v} todos os dias.",
        },
        "play": {
            "eu": "Eu {v} {obj} {time}.",
            "tu": "Tu {v} {place} {adv}?",
            "ele": "Ela {v} música {time}.",
            "nos": "Nós {v} no parque.",
            "eles": "Eles {v} {obj} juntos.",
        },
        "body": {
            "eu": "Eu {v} cedo {time}.",
            "tu": "Tu {v} bem {time}?",
            "ele": "Ele {v} no sofá.",
            "nos": "Nós {v} depois do jantar.",
            "eles": "Eles {v} {adv} em casa.",
        },
        "make": {
            "eu": "Eu {v} {thing} {time}.",
            "tu": "Tu {v} isto {adv}?",
            "ele": "Ela {v} {obj} {place}.",
            "nos": "Nós {v} {thing} juntos.",
            "eles": "Eles {v} o projecto {time}.",
        },
        "change": {
            "eu": "Eu {v} {thing} {time}.",
            "tu": "Tu {v} de ideias {adv}?",
            "ele": "Isto {v} a situação.",
            "nos": "Nós {v} o plano {time}.",
            "eles": "Eles {v} o sistema {adv}.",
        },
        "aspect": {
            "eu": "Eu {v} {time}.",
            "tu": "Tu {v} agora?",
            "ele": "Ele {v} o trabalho {adv}.",
            "nos": "Nós {v} juntos {place}.",
            "eles": "Eles {v} a reunião {time}.",
        },
        "place": {
            "eu": "Eu {v} {thing} {place}.",
            "tu": "Tu {v} isto aqui?",
            "ele": "Ela {v} o livro na mesa.",
            "nos": "Nós {v} tudo {place}.",
            "eles": "Eles {v} as coisas {adv}.",
        },
        "move": {
            "eu": "Eu {v} {thing} {place}.",
            "tu": "Tu {v} isto {adv}?",
            "ele": "Ele {v} a caixa {time}.",
            "nos": "Nós {v} os móveis juntos.",
            "eles": "Eles {v} tudo para fora.",
        },
        "org": {
            "eu": "Eu {v} {thing} {time}.",
            "tu": "Tu {v} os papéis {adv}?",
            "ele": "Ela {v} a equipa {place}.",
            "nos": "Nós {v} o trabalho juntos.",
            "eles": "Eles {v} as tarefas {time}.",
        },
        "force": {
            "eu": "Eu {v} {thing} {adv}.",
            "tu": "Tu {v} esta regra?",
            "ele": "Ele {v} a decisão {time}.",
            "nos": "Nós {v} o acordo {place}.",
            "eles": "Eles {v} o processo {adv}.",
        },
        "action": {
            "eu": "Eu {v} {thing} {time}.",
            "tu": "Tu {v} isto {adv}?",
            "ele": "Ele {v} o trabalho {place}.",
            "nos": "Nós {v} {obj} juntos.",
            "eles": "Eles {v} {thing} {time}.",
        },
    }
    return complements.get(family, complements["action"])


def make_examples(
    infinitive: str,
    level: str,
    group: str,
    forms: dict[str, str],
) -> dict[str, str]:
    """Return eu/tu/ele/nos/eles sample sentences for this verb."""
    lvl = level if level in VOCAB else "B1"

    if infinitive in SPECIAL:
        for key in (lvl, "A1", "A2", "B1"):
            if key in SPECIAL[infinitive]:
                base = SPECIAL[infinitive][key]
                return {
                    "eu": base["eu"],
                    "tu": base["tu"],
                    "ele": base["ele"],
                    "nos": base["nos"],
                    "eles": base["eles"],
                }

    family = GROUP_FAMILY.get(group, "action")
    tpls = _templates(family)
    out: dict[str, str] = {}
    for person in ("eu", "tu", "ele", "nos", "eles"):
        seed = f"{infinitive}|{person}|{lvl}"
        filled = tpls[person].format(
            v=forms[person],
            place=_pick(lvl, "place", seed + "p"),
            time=_pick(lvl, "time", seed + "t"),
            person=_pick(lvl, "person", seed + "n"),
            thing=_pick(lvl, "thing", seed + "h"),
            adv=_pick(lvl, "adv", seed + "a"),
            obj=_pick(lvl, "obj", seed + "o"),
        )
        out[person] = " ".join(filled.split())
    return out
