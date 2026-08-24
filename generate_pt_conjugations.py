# -*- coding: utf-8 -*-
"""Generate present-indicative conjugations for the 500 PT verbs PDF."""
from __future__ import annotations

import csv
import json
from pathlib import Path

from verbecc import CompleteConjugator

from also_adjectives import ALSO_ADJECTIVE, also_adj_examples, also_adj_note
from verb_groups import GROUPS
from verb_levels import LEVEL_ORDER, VERB_FREQ_RANK, VERB_LEVEL
from sentence_examples import make_examples
from word_glossary import build_glossary, tip_payload

VERBS: list[tuple[str, str]] = [
    ("ser", "be"),
    ("ter", "have"),
    ("estar", "be"),
    ("poder", "be able to"),
    ("fazer", "do"),
    ("ir", "go"),
    ("haver", "exist/be"),
    ("dizer", "say"),
    ("dar", "give"),
    ("ver", "see"),
    ("saber", "know"),
    ("querer", "want"),
    ("ficar", "stay/be"),
    ("dever", "must/should"),
    ("passar", "pass"),
    ("vir", "come"),
    ("chegar", "get there"),
    ("falar", "talk"),
    ("deixar", "leave"),
    ("encontrar", "find"),
    ("levar", "take"),
    ("começar", "begin"),
    ("partir", "depart"),
    ("pensar", "think"),
    ("parecer", "look like"),
    ("apresentar", "present"),
    ("olhar", "look"),
    ("tornar", "become"),
    ("sair", "exit"),
    ("voltar", "come/go back"),
    ("conseguir", "be able to"),
    ("achar", "find"),
    ("existir", "exist"),
    ("sentir", "feel"),
    ("entrar", "enter"),
    ("chamar", "call"),
    ("conhecer", "meet"),
    ("considerar", "consider"),
    ("pôr", "put"),
    ("continuar", "continue"),
    ("viver", "live"),
    ("ouvir", "listen"),
    ("tomar", "take"),
    ("acabar", "end"),
    ("receber", "receive"),
    ("perder", "lose"),
    ("andar", "walk"),
    ("trabalhar", "work"),
    ("criar", "create"),
    ("pedir", "request"),
    ("seguir", "follow"),
    ("contar", "count"),
    ("acontecer", "happen"),
    ("afirmar", "state"),
    ("tratar", "treat"),
    ("esperar", "wait"),
    ("gostar", "like"),
    ("usar", "use"),
    ("manter", "maintain"),
    ("realizar", "perform"),
    ("abrir", "open"),
    ("escrever", "write"),
    ("permitir", "allow"),
    ("ocorrer", "occur"),
    ("mostrar", "show"),
    ("lembrar", "remember"),
    ("trazer", "bring"),
    ("procurar", "browse"),
    ("morrer", "die"),
    ("tentar", "try"),
    ("formar", "form"),
    ("aparecer", "appear"),
    ("incluir", "include"),
    ("cair", "fall"),
    ("correr", "run"),
    ("ganhar", "win"),
    ("surgir", "arise"),
    ("nascer", "be born"),
    ("pagar", "pay"),
    ("representar", "represent"),
    ("entender", "understand"),
    ("produzir", "produce"),
    ("ler", "read"),
    ("precisar", "need"),
    ("perguntar", "ask"),
    ("constituir", "constitute"),
    ("colocar", "put"),
    ("possuir", "own"),
    ("servir", "serve"),
    ("tirar", "take away"),
    ("responder", "reply"),
    ("obter", "get"),
    ("desenvolver", "develop"),
    ("explicar", "explain"),
    ("descobrir", "discover"),
    ("acreditar", "believe"),
    ("levantar", "lift"),
    ("mandar", "send"),
    ("estudar", "study"),
    ("atingir", "reach"),
    ("sofrer", "suffer"),
    ("parar", "stop"),
    ("bater", "hit"),
    ("decidir", "decide"),
    ("referir", "refer"),
    ("fechar", "close"),
    ("aumentar", "increase"),
    ("acompanhar", "follow"),
    ("defender", "defend"),
    ("lançar", "launch"),
    ("mudar", "change"),
    ("resolver", "resolve"),
    ("participar", "participate"),
    ("subir", "go up"),
    ("utilizar", "use"),
    ("provocar", "tease"),
    ("compreender", "understand"),
    ("estabelecer", "establish"),
    ("pretender", "intend"),
    ("iniciar", "start"),
    ("perceber", "realize"),
    ("garantir", "guarantee"),
    ("comer", "eat"),
    ("vender", "sell"),
    ("observar", "note"),
    ("comprar", "buy"),
    ("aceitar", "accept"),
    ("resultar", "result"),
    ("reconhecer", "acknowledge"),
    ("sentar", "sit"),
    ("marcar", "mark"),
    ("construir", "build"),
    ("crescer", "grow"),
    ("publicar", "publish"),
    ("ajudar", "help"),
    ("assumir", "take over"),
    ("revelar", "reveal"),
    ("prever", "preview"),
    ("ocupar", "occupy"),
    ("oferecer", "offer"),
    ("dirigir", "drive"),
    ("esquecer", "forget"),
    ("tocar", "play"),
    ("envolver", "get involved"),
    ("matar", "kill"),
    ("fugir", "flee"),
    ("indicar", "indicate"),
    ("valer", "be worth"),
    ("terminar", "end"),
    ("jogar", "play"),
    ("conter", "contain"),
    ("definir", "define"),
    ("rir", "laugh"),
    ("escolher", "choose"),
    ("destacar", "highlight"),
    ("reunir", "gather"),
    ("descer", "go down"),
    ("dormir", "sleep"),
    ("causar", "cause"),
    ("evitar", "avoid"),
    ("determinar", "determine"),
    ("anunciar", "announce"),
    ("exigir", "demand"),
    ("transformar", "transform"),
    ("vencer", "win"),
    ("faltar", "be missing"),
    ("entregar", "deliver"),
    ("casar", "marry"),
    ("pegar", "catch"),
    ("eleger", "elect"),
    ("julgar", "judge"),
    ("permanecer", "remain"),
    ("apontar", "point"),
    ("virar", "turn"),
    ("concluir", "conclude"),
    ("significar", "mean"),
    ("depender", "depend"),
    ("repetir", "repeat"),
    ("abandonar", "abandon"),
    ("obrigar", "oblige"),
    ("preparar", "prepare"),
    ("aplicar", "apply"),
    ("reduzir", "reduce"),
    ("pertencer", "belong"),
    ("funcionar", "work"),
    ("retirar", "remove"),
    ("meter", "put"),
    ("verificar", "check"),
    ("estender", "extend"),
    ("acrescentar", "add"),
    ("desejar", "wish"),
    ("dividir", "split"),
    ("buscar", "fetch"),
    ("cumprir", "comply"),
    ("aproximar", "approach"),
    ("sorrir", "smile"),
    ("imaginar", "imagine"),
    ("discutir", "discuss"),
    ("apoiar", "support"),
    ("gerar", "generate"),
    ("cantar", "sing"),
    ("afastar", "move away"),
    ("admitir", "admit"),
    ("fixar", "fix"),
    ("dispor", "arrange"),
    ("chorar", "cry"),
    ("erguer", "erect"),
    ("preferir", "prefer"),
    ("aproveitar", "harness"),
    ("gritar", "shout"),
    ("promover", "promote"),
    ("integrar", "integrate"),
    ("atravessar", "cross"),
    ("alcançar", "reach"),
    ("propor", "propose"),
    ("informar", "inform"),
    ("atribuir", "attribute"),
    ("aprender", "learn"),
    ("deitar", "lie down"),
    ("cortar", "cut"),
    ("enviar", "send"),
    ("morar", "dwell"),
    ("acusar", "charge"),
    ("impedir", "prevent"),
    ("desaparecer", "disappear"),
    ("avançar", "advance"),
    ("custar", "cost"),
    ("amar", "love"),
    ("interessar", "interest"),
    ("exercer", "exercise"),
    ("dedicar", "dedicate"),
    ("assistir", "watch"),
    ("cobrir", "cover"),
    ("compor", "compose"),
    ("conduzir", "conduct"),
    ("consistir", "consist"),
    ("substituir", "replace"),
    ("descrever", "describe"),
    ("analisar", "analyze"),
    ("confirmar", "confirm"),
    ("completar", "complete"),
    ("regressar", "return"),
    ("bastar", "be enough"),
    ("prometer", "promise"),
    ("adquirir", "acquire"),
    ("baixar", "download/crouch"),
    ("conversar", "chat"),
    ("demonstrar", "demonstrate"),
    ("contribuir", "contribute"),
    ("corresponder", "correspond"),
    ("importar", "import"),
    ("identificar", "identify"),
    ("jantar", "dine"),
    ("pesar", "grieve"),
    ("prestar", "provide"),
    ("apanhar", "catch"),
    ("ligar", "call"),
    ("atirar", "throw"),
    ("caracterizar", "characterize"),
    ("enfrentar", "face"),
    ("declarar", "state"),
    ("notar", "note"),
    ("citar", "cite"),
    ("alimentar", "feed"),
    ("fornecer", "provide"),
    ("guardar", "save"),
    ("conquistar", "conquer"),
    ("caber", "fit"),
    ("beber", "drink"),
    ("designar", "designate"),
    ("juntar", "join"),
    ("esconder", "hide"),
    ("variar", "vary"),
    ("decorrer", "run"),
    ("salvar", "save"),
    ("adoptar", "adopt"),
    ("controlar", "control"),
    ("actuar", "act"),
    ("atender", "answer"),
    ("introduzir", "introduce"),
    ("cuidar", "care"),
    ("durar", "last"),
    ("dominar", "dominate"),
    ("adiantar", "forward"),
    ("recordar", "recall"),
    ("visitar", "visit"),
    ("calar", "shut up"),
    ("comentar", "comment"),
    ("melhorar", "improve"),
    ("fundar", "set up"),
    ("convidar", "invite"),
    ("proteger", "protect"),
    ("acordar", "wake up"),
    ("puxar", "pull"),
    ("instalar", "install"),
    ("viajar", "travel"),
    ("limitar", "limit"),
    ("encher", "fill"),
    ("merecer", "deserve"),
    ("assegurar", "secure"),
    ("crer", "believe"),
    ("caminhar", "walk"),
    ("conceder", "grant"),
    ("suceder", "succeed"),
    ("separar", "separate"),
    ("votar", "vote"),
    ("unir", "join"),
    ("negar", "deny"),
    ("avaliar", "evaluate"),
    ("recusar", "refuse"),
    ("sugerir", "suggest"),
    ("costumar", "customize"),
    ("alterar", "change"),
    ("preocupar", "worry"),
    ("mover", "move"),
    ("justificar", "justify"),
    ("impor", "impose"),
    ("diminuir", "decline"),
    ("atacar", "attack"),
    ("lutar", "fight"),
    ("insistir", "insist"),
    ("divulgar", "disclose"),
    ("concordar", "agree"),
    ("recolher", "collect"),
    ("respeitar", "respect"),
    ("praticar", "practice"),
    ("reflectir", "reflect"),
    ("disputar", "dispute"),
    ("deter", "stop"),
    ("transmitir", "transmit"),
    ("carregar", "load"),
    ("arrastar", "drag"),
    ("arranjar", "arrange"),
    ("temer", "fear"),
    ("trocar", "exchange"),
    ("destruir", "destroy"),
    ("recuperar", "recover"),
    ("restar", "remain"),
    ("ensinar", "teach"),
    ("comparar", "compare"),
    ("quebrar", "break"),
    ("calcular", "calculate"),
    ("ameaçar", "threaten"),
    ("afectar", "affect"),
    ("libertar", "release"),
    ("visar", "aim"),
    ("manifestar", "manifest"),
    ("misturar", "mix"),
    ("atrair", "attract"),
    ("registar", "record"),
    ("voar", "fly"),
    ("prosseguir", "continue"),
    ("demorar", "take"),
    ("ultrapassar", "overtake"),
    ("criticar", "criticize"),
    ("saltar", "skip"),
    ("gastar", "spend"),
    ("reparar", "repair"),
    ("soltar", "release"),
    ("executar", "execute"),
    ("limpar", "wipe"),
    ("invadir", "invade"),
    ("montar", "ride"),
    ("assinar", "subscribe"),
    ("aprovar", "approve"),
    ("investir", "invest"),
    ("influenciar", "influence"),
    ("apertar", "squeeze"),
    ("sustentar", "sustain"),
    ("inventar", "invent"),
    ("distinguir", "distinguish"),
    ("opor", "oppose"),
    ("escapar", "escape"),
    ("resistir", "resist"),
    ("cometer", "commit"),
    ("agir", "act"),
    ("registrar", "register"),
    ("pintar", "paint"),
    ("medir", "measure"),
    ("interromper", "interrupt"),
    ("organizar", "organize"),
    ("escutar", "listen"),
    ("empregar", "employ"),
    ("distribuir", "distribute"),
    ("espalhar", "spread"),
    ("emitir", "issue"),
    ("basear", "base"),
    ("operar", "operate"),
    ("supor", "suppose"),
    ("arrancar", "boot up"),
    ("provar", "taste"),
    ("ferir", "hurt"),
    ("estimar", "estimate"),
    ("romper", "break off"),
    ("derivar", "derive"),
    ("ceder", "yield"),
    ("percorrer", "go through"),
    ("roubar", "steal"),
    ("comandar", "command"),
    ("reclamar", "complain"),
    ("cobrar", "charge"),
    ("deslocar", "shift"),
    ("negociar", "negotiate"),
    ("transportar", "transport"),
    ("explorar", "explore"),
    ("brincar", "play"),
    ("convencer", "convince"),
    ("concentrar", "concentrate"),
    ("acertar", "hit (target)"),
    ("reagir", "react"),
    ("salientar", "highlight"),
    ("facilitar", "facilitate"),
    ("interpretar", "interpret"),
    ("reforçar", "strengthen"),
    ("desempenhar", "play"),
    ("implicar", "implicate"),
    ("recorrer", "appeal"),
    ("expor", "expose"),
    ("esclarecer", "clarify"),
    ("prender", "arrest"),
    ("vestir", "dress"),
    ("mexer", "scramble"),
    ("gravar", "record"),
    ("denunciar", "report"),
    ("aguardar", "wait"),
    ("retomar", "resume"),
    ("efectuar", "do/make"),
    ("encarar", "face"),
    ("sonhar", "dream"),
    ("avisar", "warn"),
    ("dançar", "dance"),
    ("apurar", "ascertain"),
    ("encerrar", "close"),
    ("originar", "originate"),
    ("surpreender", "surprise"),
    ("errar", "err"),
    ("acumular", "accumulate"),
    ("satisfazer", "satisfy"),
    ("tender", "tend"),
    ("necessitar", "need"),
    ("despertar", "awaken"),
    ("traduzir", "translate"),
    ("largar", "drop"),
    ("comunicar", "report"),
    ("exclamar", "exclaim"),
    ("investigar", "investigate"),
    ("segurar", "hold"),
    ("agarrar", "grab"),
    ("ordenar", "sort"),
    ("ignorar", "ignore"),
    ("governar", "rule"),
    ("experimentar", "experiment"),
    ("suportar", "endure"),
    ("desenhar", "draw"),
    ("condenar", "condemn"),
    ("inspirar", "inspire"),
    ("optar", "opt"),
    ("confessar", "confess"),
    ("colher", "collect"),
    ("constar", "be listed on"),
    ("admirar", "admire"),
    ("prejudicar", "harm"),
    ("sacudir", "shake"),
    ("murmurar", "murmur"),
    ("armar", "arm"),
    ("dobrar", "fold"),
    ("derrubar", "overturn"),
    ("acender", "light up"),
    ("circular", "circle"),
    ("apagar", "delete"),
    ("proceder", "proceed"),
    ("requerer", "request"),
    ("combater", "fight"),
    ("eliminar", "delete"),
    ("colaborar", "collaborate"),
    ("residir", "reside"),
    ("solicitar", "request"),
    ("conservar", "conserve"),
    ("alegar", "allege"),
    ("proibir", "ban"),
    ("encaminhar", "forward"),
    ("elevar", "raise"),
    ("modificar", "modify"),
    ("combinar", "combine"),
    ("classificar", "sort"),
    ("exibir", "display"),
    ("conferir", "confer"),
    ("contemplar", "contemplate"),
    ("beneficiar", "benefit"),
    ("queimar", "burn"),
    ("sobreviver", "survive"),
    ("adaptar", "adapt"),
    ("situar", "situate"),
    ("projectar", "project"),
    ("rejeitar", "reject"),
    ("tremer", "shiver"),
    ("lavar", "wash"),
    ("frequentar", "attend"),
    ("convocar", "convene"),
]

# EP spellings → lookup form when templates are cleaner under AO90/BR lemma
LOOKUP = {
    "reflectir": "refletir",
    "actuar": "atuar",
    "adoptar": "adotar",
    "efectuar": "efetuar",
    "projectar": "projetar",
    "afectar": "afetar",
}

# Manual present-indicative fixes where verbecc templates are wrong
# Values: eu, tu, ele/ela, nós, vocês(=eles/elas)
MANUAL: dict[str, tuple[str, str, str, str, str]] = {
    "ir": ("vou", "vais", "vai", "vamos", "vão"),
    "construir": ("construo", "constróis", "constrói", "construímos", "constroem"),
    "destruir": ("destruo", "destróis", "destrói", "destruímos", "destroem"),
    "haver": ("hei", "hás", "há", "havemos", "hão"),
}


def strip_pronoun(conj: str, pronoun: str) -> str:
    prefix = pronoun + " "
    if conj.startswith(prefix):
        return conj[len(prefix) :]
    return conj


def main() -> None:
    # Source PDF is titled "500 verbs" but the printed list has 499 entries.
    assert len(VERBS) == 499, len(VERBS)
    conjugator = CompleteConjugator(lang="pt")
    rows: list[dict[str, str]] = []
    errors: list[tuple[str, str, str]] = []
    predicted: list[str] = []

    for infinitive, english in VERBS:
        if infinitive in MANUAL:
            eu, tu, ele, nos, voces = MANUAL[infinitive]
            rows.append(
                {
                    "infinitive": infinitive,
                    "english": english,
                    "eu": eu,
                    "tu": tu,
                    "ele_ela": ele,
                    "nos": nos,
                    "eles_elas_voces": voces,
                }
            )
            continue

        lookup = LOOKUP.get(infinitive, infinitive)
        try:
            data = json.loads(conjugator.conjugate(lookup).to_json())
            by_pr = {
                item["pr"]: strip_pronoun(item["c"][0], item["pr"])
                for item in data["moods"]["indicativo"]["presente"]
            }
            plural = by_pr["vocês"]
            if data["verb"].get("predicted"):
                predicted.append(infinitive)
            rows.append(
                {
                    "infinitive": infinitive,
                    "english": english,
                    "eu": by_pr["eu"],
                    "tu": by_pr["tu"],
                    "ele_ela": by_pr["ele"],
                    "nos": by_pr["nós"],
                    "eles_elas_voces": plural,
                }
            )
        except Exception as exc:  # noqa: BLE001
            errors.append((infinitive, type(exc).__name__, str(exc)))

    # Clearer dictionary-style glosses (PDF gave "English - To…")
    BETTER_GLOSS = {
        "ser": "to be (permanent/essential)",
        "estar": "to be (temporary/location)",
        "haver": "to exist / there is/are",
        "ficar": "to stay / to become / to be located",
        "dever": "must / should / to owe",
        "chegar": "to arrive / to get there",
        "voltar": "to come/go back",
        "conhecer": "to know / to meet (people/places)",
        "saber": "to know (facts/how)",
        "pedir": "to ask for / to request",
        "procurar": "to look for / to seek",
        "levar": "to take / to carry",
        "trazer": "to bring",
        "passar": "to pass / to spend (time)",
        "parecer": "to seem / to look like",
        "conseguir": "to manage / to be able to",
        "achar": "to find / to think",
        "prever": "to foresee / to predict",
        "provocar": "to provoke / to cause",
        "perceber": "to realize / to notice",
        "observar": "to observe / to notice",
        "pesar": "to weigh / to grieve",
        "costumar": "to be used to / to usually do",
        "mexer": "to move / to stir / to touch",
        "arrancar": "to pull out / to start (up)",
        "assinar": "to sign",
        "acusar": "to accuse",
        "baixar": "to lower / to download",
        "montar": "to assemble / to ride / to set up",
        "desempenhar": "to perform / to play (a role)",
        "comunicar": "to communicate / to report",
        "efectuar": "to carry out / to do",
        "ordenar": "to order / to sort",
        "classificar": "to classify / to sort",
        "limpar": "to clean / to wipe",
        "importar": "to matter / to import",
        "prestar": "to provide / to lend / to be useful",
        "valer": "to be worth",
        "bastar": "to be enough",
        "faltar": "to be missing / to lack",
        "custar": "to cost",
        "demorar": "to take (time) / to delay",
        "constar": "to appear / to be listed",
        "aproveitar": "to take advantage of / to enjoy",
        "assistir": "to watch / to attend",
        "atender": "to answer / to attend to",
        "ligar": "to call / to turn on / to connect",
        "apagar": "to erase / to turn off / to delete",
        "acender": "to light / to turn on",
        "gravar": "to record / to engrave",
        "registar": "to register / to record",
        "registrar": "to register",
        "cobrar": "to charge (money) / to demand",
        "reclamar": "to complain / to claim",
        "salvar": "to save",
        "guardar": "to keep / to save / to put away",
        "jogar": "to play (a game) / to throw",
        "tocar": "to touch / to play (music)",
        "brincar": "to play (fun)",
        "correr": "to run",
        "decorrer": "to elapse / to take place",
        "recorrer": "to resort to / to appeal",
        "tratar": "to treat / to deal with",
        "passar": "to pass / to spend (time)",
        "realizar": "to carry out / to achieve",
        "assumir": "to assume / to take on",
        "fixar": "to fix / to set",
        "visar": "to aim / to target",
        "actuar": "to act",
        "agir": "to act",
        "reflectir": "to reflect",
        "afectar": "to affect",
        "libertar": "to free / to release",
        "projectar": "to project / to plan",
        "adoptar": "to adopt",
        "circular": "to circulate / to go around",
    }

    def definition_for(infinitive: str, gloss: str) -> str:
        if infinitive in BETTER_GLOSS:
            return BETTER_GLOSS[infinitive]
        g = gloss.strip()
        if g.lower().startswith("to "):
            return g
        return f"to {g}"

    for row in rows:
        row["english"] = definition_for(row["infinitive"], row["english"])

    # Reorder: meaning group → CEFR level → frequency (PDF rank)
    by_inf = {r["infinitive"]: r for r in rows}
    grouped_rows: list[dict[str, str]] = []
    seen: set[str] = set()
    for group_name, verbs in GROUPS:
        members = []
        for inf in verbs:
            if inf in by_inf and inf not in seen:
                row = dict(by_inf[inf])
                row["group"] = group_name
                row["level"] = VERB_LEVEL[inf]
                row["freq_rank"] = str(VERB_FREQ_RANK[inf])
                row["also_adjective"] = "yes" if inf in ALSO_ADJECTIVE else ""
                row["also_adjective_note"] = also_adj_note(inf)
                members.append(row)
                seen.add(inf)
        members.sort(
            key=lambda r: (
                LEVEL_ORDER.index(r["level"]),
                int(r["freq_rank"]),
            )
        )
        grouped_rows.extend(members)
    leftovers = [r for r in rows if r["infinitive"] not in seen]
    assert not leftovers, [r["infinitive"] for r in leftovers]
    rows = grouped_rows

    fieldnames = [
        "group",
        "level",
        "freq_rank",
        "infinitive",
        "english",
        "also_adjective",
        "also_adjective_note",
        "eu",
        "tu",
        "ele_ela",
        "nos",
        "eles_elas_voces",
    ]

    out_paths = [
        Path(r"c:\Users\AmyCheung\Downloads\500-portuguese-verbs-conjugations.csv"),
        Path(r"c:\Users\AmyCheung\CursorProjects\500-portuguese-verbs-conjugations.csv"),
    ]
    for path in out_paths:
        with path.open("w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    json_path = Path(
        r"c:\Users\AmyCheung\Downloads\500-portuguese-verbs-conjugations.json"
    )
    with json_path.open("w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)

    # Interactive HTML: embed data + choose 1–3 sort keys
    group_order = [name for name, _ in GROUPS]
    data_json = json.dumps(
        [
            {
                "group": r["group"],
                "level": r["level"],
                "freq": int(r["freq_rank"]),
                "inf": r["infinitive"],
                "en": r["english"],
                "adj": bool(r.get("also_adjective")),
                "adjNote": r.get("also_adjective_note") or "",
                "adjEx": also_adj_examples(r["infinitive"]),
                "eu": r["eu"],
                "tu": r["tu"],
                "ele": r["ele_ela"],
                "nos": r["nos"],
                "eles": r["eles_elas_voces"],
                "ex": make_examples(
                    r["infinitive"],
                    r["level"],
                    r["group"],
                    {
                        "eu": r["eu"],
                        "tu": r["tu"],
                        "ele": r["ele_ela"],
                        "nos": r["nos"],
                        "eles": r["eles_elas_voces"],
                    },
                ),
            }
            for r in rows
        ],
        ensure_ascii=False,
        indent=1,  # short lines — mobile Safari chokes on 200KB+ single-line JS
    )
    groups_json = json.dumps(group_order, ensure_ascii=False)
    levels_json = json.dumps(LEVEL_ORDER, ensure_ascii=False)
    glossary_json = json.dumps(
        tip_payload(build_glossary(rows)),
        ensure_ascii=False,
        indent=1,
    )

    html = f"""<!DOCTYPE html><html lang="pt">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Presente do Indicativo</title>
<style>
  :root {{ font-family: "Segoe UI", system-ui, sans-serif; }}
  body {{ margin: 1.5rem; background: #f7f4ef; color: #1c1917; }}
  h1 {{ font-size: 1.4rem; margin: 0 0 .25rem; }}
  .sub {{ margin: 0 0 1rem; color: #57534e; }}
  .controls {{ display: flex; flex-wrap: wrap; gap: .4rem; align-items: center;
               margin: 0 0 1rem; padding: .85rem 1rem; background: #fff;
               border: 1px solid #e7e5e4; border-radius: 10px; }}
  .ctrl {{ display: none; }}
  button.preset {{ padding: .35rem .65rem; border: 1px solid #d6d3d1; background: #f5f5f4;
                   border-radius: 6px; font-size: .82rem; cursor: pointer; color: #292524; }}
  button.preset:hover, button.preset.active {{ background: #292524; color: #fafaf9; border-color: #292524; }}
  .nav {{ display: flex; flex-wrap: wrap; gap: .4rem; }}
  .chip {{ display: inline-block; padding: .3rem .55rem; background: #e7e5e4;
           color: #292524; text-decoration: none; border-radius: 6px; font-size: .78rem;
           border: none; cursor: pointer; font: inherit; }}
  .chip:hover {{ background: #d6d3d1; }}
  .jump-panel {{ position: relative; margin: 0 0 .55rem; background: #fff;
                 border: 1px solid #e7e5e4; border-radius: 10px; z-index: 5; }}
  .jump-toggle {{ width: 100%; display: flex; align-items: center; justify-content: space-between;
                  gap: .5rem; padding: .55rem .75rem; border: 0; background: transparent;
                  cursor: pointer; font: inherit; font-size: .82rem; font-weight: 600;
                  color: #44403c; text-align: left; }}
  .jump-toggle::after {{ content: "▸"; color: #a8a29e; font-size: .75rem; }}
  .jump-panel.open .jump-toggle::after {{ content: "▾"; }}
  .jump-menu {{ display: none; position: absolute; left: 0; right: 0; top: calc(100% - 1px);
                z-index: 30; padding: .55rem .75rem .7rem; background: #fff;
                border: 1px solid #e7e5e4; border-radius: 0 0 10px 10px;
                box-shadow: 0 10px 24px rgba(0,0,0,.12); max-height: min(42vh, 22rem);
                overflow: auto; -webkit-overflow-scrolling: touch; }}
  .jump-panel.open .jump-menu {{ display: block; }}
  .jump-panel.open {{ border-radius: 10px 10px 0 0; z-index: 40; }}
  .search-row {{ margin: .75rem 0 .75rem; }}
  input[type="search"] {{ width: min(420px, 100%); padding: .5rem .65rem; border: 1px solid #d6d3d1;
           border-radius: 8px; font-size: .95rem; background: #fff; color: #1c1917; }}
  .count {{ font-size: .9rem; color: #78716c; margin-bottom: .75rem; }}
  .err {{ display: none; margin: 0 0 1rem; padding: .75rem 1rem; background: #fef2f2;
          border: 1px solid #fecaca; color: #991b1b; border-radius: 8px; font-size: .9rem; }}
  table {{ border-collapse: collapse; width: 100%; background: #fff; }}
  th, td {{ border-bottom: 1px solid #e7e5e4; padding: .45rem .55rem; text-align: left;
            font-size: .92rem; white-space: nowrap; }}
  td.def {{ white-space: normal; min-width: 12rem; max-width: 22rem; color: #44403c; }}
  td.lvl {{ font-weight: 700; color: #78716c; width: 2.5rem; }}
  th {{ position: sticky; top: 0; background: #292524; color: #fafaf9; font-weight: 600; z-index: 3; }}
  tr.section td {{ background: #44403c; color: #fafaf9; padding: .65rem .55rem; }}
  tr.section .gname {{ font-weight: 700; font-size: .98rem; }}
  tr.section .gcount {{ float: right; opacity: .75; font-size: .82rem; font-weight: 500; }}
  tr.subsec td {{ background: #e7e5e4; color: #292524; padding: .4rem .55rem; font-weight: 700; }}
  tr.subsec .lcount {{ float: right; opacity: .65; font-weight: 500; font-size: .82rem; }}
  tr.verb {{ cursor: pointer; content-visibility: auto; contain-intrinsic-size: auto 2.5rem; }}
  tr.verb:hover td {{ background: #fafaf9; }}
  tr.verb.open td {{ background: #f5f5f4; }}
  .ex-note {{ font-size: .8rem; color: #78716c; margin: 0 0 .65rem; }}
  .ex-list {{ margin: 0; padding: 0; list-style: none; display: grid; gap: .45rem; }}
  .ex-list li {{ font-size: .95rem; line-height: 1.35; }}
  .ex-list .who {{ display: inline-block; min-width: 7.5rem; font-weight: 700; color: #44403c; }}
  .ex-list .form {{ color: #a8a29e; font-size: .85rem; margin-right: .35rem; }}
  .ex-list mark {{ background: #fef3c7; color: inherit; padding: 0 .15rem; border-radius: 2px; }}
  .ex-section {{ margin: 0 0 1rem; }}
  .ex-section:last-child {{ margin-bottom: 0; }}
  .ex-section-title {{ font-size: .78rem; font-weight: 700; letter-spacing: .04em;
                       text-transform: uppercase; color: #78716c; margin: 0 0 .55rem; }}
  .ex-adj-list {{ margin: 0; padding: 0; list-style: none; display: grid; gap: .65rem; }}
  .ex-adj-list li {{ font-size: .95rem; line-height: 1.4; }}
  .ex-adj-list .ex-label {{ display: inline-block; min-width: 5.5rem; font-weight: 700;
                            color: #44403c; font-size: .82rem; text-transform: lowercase; }}
  .ex-adj-list .ex-en {{ display: block; margin-top: .2rem; font-size: .82rem; color: #78716c; }}
  .hint {{ font-size: .82rem; color: #78716c; margin: 0 0 .75rem; }}
  .badge-adj {{ display: inline-block; margin-left: .4rem; padding: .1rem .4rem;
                font-size: .68rem; font-weight: 700; letter-spacing: .03em;
                text-transform: uppercase; vertical-align: middle;
                background: #dbeafe; color: #1e3a8a; border-radius: 4px; cursor: pointer;
                border: 1px solid transparent; }}
  .badge-adj:hover {{ border-color: #93c5fd; }}
  .badge-adj.active {{ background: #1e3a8a; color: #eff6ff; }}
  .hint .badge-adj {{ margin-left: .15rem; margin-right: .15rem; }}
  .w {{ border-bottom: 1px dotted #a8a29e; cursor: help; }}
  td.w, strong .w {{ border-bottom: 1px dotted #a8a29e; }}
  .w:hover {{ background: #fef3c7; border-bottom-color: #d97706; }}
  body.ex-open {{ overflow: hidden; touch-action: none; overscroll-behavior: none; }}
  .ex-backdrop {{ display: none; position: fixed; inset: 0; z-index: 55;
                  background: rgba(28,25,23,.4); }}
  .ex-backdrop.show {{ display: block; }}
  .ex-sheet {{ display: none; position: fixed; left: 0; right: 0; bottom: 0; z-index: 60;
               height: min(82vh, 40rem); max-height: 82vh; background: #fafaf9; color: #1c1917;
               border-radius: 16px 16px 0 0; box-shadow: 0 -12px 40px rgba(0,0,0,.28);
               padding: 0; overflow: hidden; flex-direction: column; }}
  .ex-sheet.show {{ display: flex; }}
  .ex-handle {{ flex: 0 0 auto; display: flex; justify-content: center; padding: .55rem 0 .15rem; }}
  .ex-handle span {{ width: 2.5rem; height: .28rem; border-radius: 999px; background: #d6d3d1; }}
  .ex-sheet-head {{ flex: 0 0 auto; display: flex; align-items: flex-start;
                    justify-content: space-between; gap: .75rem; padding: .35rem 1rem .75rem;
                    background: #fafaf9; border-bottom: 1px solid #e7e5e4; }}
  .ex-sheet-head .ex-title {{ font-weight: 700; font-size: 1.15rem; }}
  .ex-sheet-head .ex-sub {{ font-size: .82rem; color: #78716c; font-weight: 500; margin-top: .2rem;
                            line-height: 1.35; }}
  .ex-close {{ border: 0; background: #e7e5e4; color: #292524; width: 2.15rem; height: 2.15rem;
               border-radius: 999px; font-size: 1.15rem; line-height: 1; cursor: pointer; flex: 0 0 auto; }}
  .ex-sheet-body {{ flex: 1 1 auto; overflow: auto; -webkit-overflow-scrolling: touch;
                    padding: .85rem 1rem 1.25rem; overscroll-behavior: contain; }}
  #tip {{
    position: fixed; z-index: 70; display: none; max-width: min(22rem, calc(100vw - 1.5rem));
    padding: .65rem .8rem; background: #1c1917; color: #fafaf9;
    border-radius: 8px; font-size: .82rem; line-height: 1.35;
    box-shadow: 0 8px 24px rgba(0,0,0,.25); pointer-events: none;
    white-space: pre-line;
  }}
  #tip .tip-word {{ font-weight: 700; color: #fde68a; margin-bottom: .15rem; }}
  #tip .tip-ipa {{ color: #a7f3d0; font-size: .86rem; margin: .1rem 0 .25rem; }}
  #tip .tip-gloss {{ font-size: .9rem; }}
  #tip .tip-morph {{ color: #d6d3d1; margin-top: .25rem; font-size: .78rem; }}
</style>
</head>
<body>
  <h1>Presente do Indicativo</h1>
  <p class="sub" id="sortDesc">Sort with a button below · use Group panels to skip ahead</p>
  <p class="hint">Tap/click a verb row to open sample sentences in a panel.<br/>
     A blue <button type="button" class="badge-adj" id="adjFilterBtn" title="Show only also-adjective verbs">also adj.</button>
     badge marks infinitives that are also adjectives/nouns — tap it to show only those
     (from Cognate Patterns AR list; only <span id="adjCount">1</span> overlap with this verb list).<br/>
     Hover or tap any underlined word for English + part of speech + gender/number forms.</p>
  <div id="tip" role="tooltip"></div>
  <div class="ex-backdrop" id="exBackdrop" hidden></div>
  <div class="ex-sheet" id="exSheet" hidden role="dialog" aria-modal="true" aria-labelledby="exTitle">
    <div class="ex-handle" aria-hidden="true"><span></span></div>
    <div class="ex-sheet-head">
      <div>
        <div class="ex-title" id="exTitle"></div>
        <div class="ex-sub" id="exSub"></div>
      </div>
      <button type="button" class="ex-close" id="exClose" aria-label="Close">×</button>
    </div>
    <div class="ex-sheet-body" id="exBody"></div>
  </div>

  <div class="controls">
    <button type="button" class="preset active" data-sort="group,level,freq">Meaning → Level → Freq</button>
    <button type="button" class="preset" data-sort="level,freq,">Level → Freq</button>
    <button type="button" class="preset" data-sort="level,group,freq">Level → Meaning → Freq</button>
    <button type="button" class="preset" data-sort="freq,,">Frequency only</button>
    <button type="button" class="preset" data-sort="group,freq,">Meaning → Freq</button>
  </div>

  <div class="jump-panel" id="jumpGroups">
    <button type="button" class="jump-toggle" aria-expanded="false">Group by meaning</button>
    <div class="jump-menu" hidden>
      <div class="nav" id="nav"></div>
    </div>
  </div>
  <div class="jump-panel" id="jumpLevels">
    <button type="button" class="jump-toggle" aria-expanded="false">Group by level</button>
    <div class="jump-menu" hidden>
      <div class="nav" id="navLevels"></div>
    </div>
  </div>
  <div class="search-row">
    <input id="q" type="search" placeholder="Search verb, definition, level, or group…" autofocus/>
  </div>
  <div class="count"><span id="n">0</span> verbs shown</div>
  <div class="err" id="err"></div>
  <table>
    <thead>
      <tr>
        <th>Lvl</th><th>Infinitive</th><th>English definition</th>
        <th>eu</th><th>tu</th><th>ele/ela</th>
        <th>nós</th><th>eles/elas/vocês</th>
      </tr>
    </thead>
    <tbody id="tb"></tbody>
  </table>

<script>
try {{
const DATA = __DATA_JSON__;
const GROUP_ORDER = __GROUPS_JSON__;
const LEVEL_ORDER = __LEVELS_JSON__;
const GLOSS = __GLOSSARY_JSON__;
const LABELS = {{ group: "Meaning", level: "Level", freq: "Frequency" }};

const tb = document.getElementById("tb");
const nav = document.getElementById("nav");
const navLevels = document.getElementById("navLevels");
const nEl = document.getElementById("n");
const q = document.getElementById("q");
const sortDesc = document.getElementById("sortDesc");
let sortState = ["group", "level", "freq"];
let adjOnly = false;

function slug(s) {{
  return String(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}}

function keys() {{
  return sortState.filter(Boolean);
}}

function setSort(a, b, c) {{
  sortState = [a || "group", b || "", c || ""];
}}

function sortKey(row, key) {{
  if (key === "group") return GROUP_ORDER.indexOf(row.group);
  if (key === "level") return LEVEL_ORDER.indexOf(row.level);
  if (key === "freq") return row.freq;
  return 0;
}}

function sectionValue(row, key) {{
  if (key === "group") return row.group;
  if (key === "level") return row.level;
  if (key === "freq") {{
    if (row.freq <= 50) return "Freq 1–50 (most used)";
    if (row.freq <= 150) return "Freq 51–150";
    if (row.freq <= 300) return "Freq 151–300";
    if (row.freq <= 400) return "Freq 301–400";
    return "Freq 401–499 (least used here)";
  }}
  return "";
}}

function sortedData() {{
  const ks = keys();
  return [...DATA].sort((a, b) => {{
    for (const k of ks) {{
      const d = sortKey(a, k) - sortKey(b, k);
      if (d) return d;
    }}
    return a.inf.localeCompare(b.inf);
  }});
}}

function scrollToId(id) {{
  const el = document.getElementById(id);
  if (!el) return;
  // instant scroll — smooth + huge table freezes mobile browsers
  el.scrollIntoView({{ behavior: "auto", block: "start" }});
}}

function jumpToGroup(id) {{
  if (sortState[0] !== "group") {{
    setSort("group", "level", "freq");
    render();
  }}
  requestAnimationFrame(() => scrollToId(id));
}}

function jumpToLevel(level) {{
  if (sortState[0] !== "level") {{
    setSort("level", "freq", "");
    render();
  }}
  requestAnimationFrame(() => scrollToId(slug(level)));
}}

function renderGroupChips() {{
  const counts = {{}};
  for (const r of DATA) counts[r.group] = (counts[r.group] || 0) + 1;
  nav.innerHTML = GROUP_ORDER.map(g => {{
    const id = slug(g);
    const n = counts[g] || 0;
    return `<button type="button" class="chip" data-gid="${{id}}">${{g}} <span style="opacity:.65">(${{n}})</span></button>`;
  }}).join("");
}}

function renderLevelChips() {{
  const counts = {{}};
  for (const r of DATA) counts[r.level] = (counts[r.level] || 0) + 1;
  navLevels.innerHTML = LEVEL_ORDER.map(lv =>
    `<button type="button" class="chip" data-level="${{lv}}">${{lv}} <span style="opacity:.65">(${{counts[lv] || 0}})</span></button>`
  ).join("");
}}

function render() {{
  closeExSheet();
  const ks = keys();
  const primary = ks[0] || "group";
  const secondary = ks[1] || null;
  sortDesc.textContent = "Sort: " + ks.map(k => LABELS[k]).join(" → ")
    + " · Group panels skip to a meaning or level";

  const rows = sortedData();
  const parts = [];
  let curPrimary = null;
  let curSecondary = null;
  let primaryCount = 0;
  let secondaryCount = 0;

  // Pre-count primary sections in one pass
  const primaryCounts = {{}};
  for (const r of rows) {{
    const pv = sectionValue(r, primary);
    primaryCounts[pv] = (primaryCounts[pv] || 0) + 1;
  }}
  const secondaryCounts = {{}};
  if (secondary === "group" || secondary === "level") {{
    for (const r of rows) {{
      const key = sectionValue(r, primary) + "\\0" + sectionValue(r, secondary);
      secondaryCounts[key] = (secondaryCounts[key] || 0) + 1;
    }}
  }}

  const tipCell = (form) => {{
    const key = String(form).toLowerCase();
    return GLOSS[key]
      ? `<td class="w" data-w="${{esc(key)}}">${{esc(form)}}</td>`
      : `<td>${{esc(form)}}</td>`;
  }};

  for (const r of rows) {{
    const pVal = sectionValue(r, primary);
    const useSub = secondary === "group" || secondary === "level";

    if (pVal !== curPrimary) {{
      curPrimary = pVal;
      curSecondary = null;
      primaryCount = primaryCounts[pVal] || 0;
      const id = slug(pVal);
      parts.push(
        `<tr class="section" id="${{id}}"><td colspan="8"><span class="gname">${{pVal}}</span>` +
        `<span class="gcount">${{primaryCount}} verbs</span></td></tr>`
      );
    }}

    if (useSub) {{
      const sv = sectionValue(r, secondary);
      if (sv !== curSecondary) {{
        curSecondary = sv;
        secondaryCount = secondaryCounts[curPrimary + "\\0" + sv] || 0;
        parts.push(
          `<tr class="subsec"><td colspan="8"><span class="lname">${{sv}}</span>` +
          `<span class="lcount">${{secondaryCount}}</span></td></tr>`
        );
      }}
    }}

    const adjBadge = r.adj
      ? `<span class="badge-adj" title="${{esc(r.adjNote || "also adjective/noun")}}">also adj.</span>`
      : "";
    const searchExtra = r.adj ? " also adjective adj" : "";
    const infCell = GLOSS[String(r.inf).toLowerCase()]
      ? `<strong class="w" tabindex="0" data-w="${{esc(String(r.inf).toLowerCase())}}">${{esc(r.inf)}}</strong>`
      : `<strong>${{esc(r.inf)}}</strong>`;
    parts.push(
      `<tr class="verb" data-inf="${{esc(r.inf)}}" data-adj="${{r.adj ? "1" : "0"}}" data-text="${{esc(r.inf + " " + r.en + " " + r.level + " " + r.group + searchExtra)}}">` +
      `<td class="lvl">${{r.level}}</td>` +
      `<td>${{infCell}}${{adjBadge}}</td>` +
      `<td class="def">${{esc(r.en)}}</td>` +
      tipCell(r.eu) + tipCell(r.tu) + tipCell(r.ele) + tipCell(r.nos) + tipCell(r.eles) +
      `</tr>`
    );
  }}

  tb.innerHTML = parts.join("");
  const adjCountEl = document.getElementById("adjCount");
  if (adjCountEl) adjCountEl.textContent = String(DATA.filter(x => x.adj).length);
  applyFilter();
  markPreset();
}}

function highlightForm(sentence, form) {{
  return String(sentence).replace(/[A-Za-zÀ-ÿ']+|[^A-Za-zÀ-ÿ']+/g, (m) => {{
    if (!/[A-Za-zÀ-ÿ']/.test(m[0])) return esc(m);
    const wrapped = wrapWord(m);
    if (form && m.toLowerCase() === String(form).toLowerCase()) {{
      return "<mark>" + wrapped + "</mark>";
    }}
    return wrapped;
  }});
}}

function buildDetailBody(r) {{
  const labels = [
    ["eu", "eu", r.eu],
    ["tu", "tu", r.tu],
    ["ele", "ele/ela", r.ele],
    ["nos", "nós", r.nos],
    ["eles", "eles/elas/vocês", r.eles],
  ];
  const verbItems = labels.map(([k, who, form]) => {{
    const sent = (r.ex && r.ex[k]) ? r.ex[k] : "";
    return `<li><span class="who">${{who}}</span> <span class="form">(${{wrapWord(form)}})</span> ${{highlightForm(sent, form)}}</li>`;
  }}).join("");
  const verbBlock =
    `<div class="ex-section"><div class="ex-section-title">As a verb</div>` +
    `<ul class="ex-list">${{verbItems}}</ul></div>`;

  if (!r.adj || !r.adjEx || !r.adjEx.length) return verbBlock;

  const adjItems = r.adjEx.map(ex => {{
    const form = ex.form || r.inf;
    const label = ex.label || "adjective";
    const en = ex.en ? `<span class="ex-en">${{esc(ex.en)}}</span>` : "";
    return `<li><span class="ex-label">${{esc(label)}}</span> ${{highlightForm(ex.pt || "", form)}}${{en}}</li>`;
  }}).join("");
  const note = r.adjNote ? `<p class="ex-note">${{esc(r.adjNote)}}</p>` : "";
  const adjBlock =
    `<div class="ex-section"><div class="ex-section-title">As an adjective / noun</div>` +
    note +
    `<ul class="ex-adj-list">${{adjItems}}</ul></div>`;
  return verbBlock + adjBlock;
}}

const exSheet = document.getElementById("exSheet");
const exBackdrop = document.getElementById("exBackdrop");
const exTitle = document.getElementById("exTitle");
const exSub = document.getElementById("exSub");
const exBody = document.getElementById("exBody");
const exClose = document.getElementById("exClose");
let openInf = null;
let scrollLockY = 0;

function lockPageScroll() {{
  scrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
  document.body.classList.add("ex-open");
  document.body.style.top = `-${{scrollLockY}}px`;
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
}}

function unlockPageScroll() {{
  document.body.classList.remove("ex-open");
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  window.scrollTo(0, scrollLockY);
}}

function closeExSheet() {{
  if (!exSheet.classList.contains("show") && exSheet.hidden) return;
  exSheet.classList.remove("show");
  exBackdrop.classList.remove("show");
  exSheet.hidden = true;
  exBackdrop.hidden = true;
  tb.querySelectorAll("tr.verb.open").forEach(v => v.classList.remove("open"));
  openInf = null;
  unlockPageScroll();
}}

function openExSheet(r, tr) {{
  tb.querySelectorAll("tr.verb.open").forEach(v => v.classList.remove("open"));
  tr.classList.add("open");
  openInf = r.inf;
  exTitle.textContent = r.inf;
  exSub.textContent = `${{r.level}} · ${{r.en}}`;
  exBody.innerHTML = buildDetailBody(r);
  exBody.scrollTop = 0;
  exSheet.hidden = false;
  exBackdrop.hidden = false;
  lockPageScroll();
  requestAnimationFrame(() => {{
    exSheet.classList.add("show");
    exBackdrop.classList.add("show");
  }});
}}

function toggleVerbRow(tr) {{
  const inf = tr.dataset.inf;
  if (openInf === inf) {{
    closeExSheet();
    return;
  }}
  const r = DATA.find(x => x.inf === inf);
  if (!r) return;
  openExSheet(r, tr);
}}

function esc(s) {{
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
}}

function wrapWord(word) {{
  const key = String(word).toLowerCase();
  if (!GLOSS[key]) return esc(word);
  return `<span class="w" tabindex="0" data-w="${{esc(key)}}">${{esc(word)}}</span>`;
}}

const tipEl = document.getElementById("tip");
let tipHideTimer = null;
let tipTarget = null;

function tipHtml(raw) {{
  const lines = String(raw).split("\\n");
  if (!lines.length) return "";
  const word = lines[0] || "";
  let i = 1;
  let ipa = "";
  if (lines[i] && lines[i].startsWith("/")) {{
    ipa = lines[i];
    i += 1;
  }}
  const gloss = lines[i] || "";
  const rest = lines.slice(i + 1).map(l => `<div class="tip-morph">${{esc(l)}}</div>`).join("");
  const ipaHtml = ipa ? `<div class="tip-ipa">${{esc(ipa)}}</div>` : "";
  return `<div class="tip-word">${{esc(word)}}</div>${{ipaHtml}}<div class="tip-gloss">${{esc(gloss)}}</div>${{rest}}`;
}}

function hideTip() {{
  clearTimeout(tipHideTimer);
  tipEl.style.display = "none";
  tipTarget = null;
}}

function showTip(el) {{
  const key = el.dataset.w;
  const raw = GLOSS[key];
  if (!raw) return;
  clearTimeout(tipHideTimer);
  tipTarget = el;
  tipEl.innerHTML = tipHtml(raw);
  tipEl.style.display = "block";
  const r = el.getBoundingClientRect();
  const tw = tipEl.offsetWidth;
  const th = tipEl.offsetHeight;
  let left = r.left + r.width / 2 - tw / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
  let top = r.top - th - 8;
  if (top < 8) top = r.bottom + 8;
  tipEl.style.left = left + "px";
  tipEl.style.top = top + "px";
}}

function hideTipSoon() {{
  tipHideTimer = setTimeout(() => {{ hideTip(); }}, 80);
}}

function toggleTip(el) {{
  if (tipTarget === el && tipEl.style.display === "block") {{
    hideTip();
    return;
  }}
  showTip(el);
}}

function closeJumpPanels(exceptId) {{
  document.querySelectorAll(".jump-panel.open").forEach(panel => {{
    if (exceptId && panel.id === exceptId) return;
    panel.classList.remove("open");
    const menu = panel.querySelector(".jump-menu");
    const btn = panel.querySelector(".jump-toggle");
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");
  }});
}}

function toggleJumpPanel(panel) {{
  const willOpen = !panel.classList.contains("open");
  closeJumpPanels(willOpen ? panel.id : null);
  const menu = panel.querySelector(".jump-menu");
  const btn = panel.querySelector(".jump-toggle");
  if (willOpen) {{
    panel.classList.add("open");
    if (menu) menu.hidden = false;
    if (btn) btn.setAttribute("aria-expanded", "true");
  }} else {{
    panel.classList.remove("open");
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");
  }}
}}

// One delegated listener set — avoids thousands of handlers that freeze mobile
function wireDelegates() {{
  document.addEventListener("click", (ev) => {{
    const adjBadge = ev.target.closest(".badge-adj");
    if (adjBadge) {{
      ev.preventDefault();
      ev.stopPropagation();
      adjOnly = !adjOnly;
      applyFilter();
      return;
    }}
    if (ev.target.closest("#exClose") || ev.target === exBackdrop) {{
      closeExSheet();
      return;
    }}
    const toggle = ev.target.closest(".jump-toggle");
    if (toggle) {{
      ev.preventDefault();
      ev.stopPropagation();
      toggleJumpPanel(toggle.closest(".jump-panel"));
      return;
    }}
    const chip = ev.target.closest(".chip");
    if (chip && chip.dataset.gid) {{
      ev.preventDefault();
      jumpToGroup(chip.dataset.gid);
      closeJumpPanels();
      return;
    }}
    if (chip && chip.dataset.level) {{
      ev.preventDefault();
      jumpToLevel(chip.dataset.level);
      closeJumpPanels();
      return;
    }}
    if (!ev.target.closest(".jump-panel")) closeJumpPanels();
    const w = ev.target.closest(".w");
    if (w) {{
      ev.preventDefault();
      ev.stopPropagation();
      toggleTip(w);
      return;
    }}
    if (ev.target.closest("#exSheet")) return;
    const verb = ev.target.closest("tr.verb");
    if (verb && tb.contains(verb)) {{
      toggleVerbRow(verb);
      return;
    }}
    // click elsewhere closes tip
    if (tipEl.style.display === "block" && !ev.target.closest("#tip")) hideTip();
  }});

  document.addEventListener("mouseover", (ev) => {{
    const w = ev.target.closest(".w");
    if (!w || w === tipTarget) return;
    // only desktop hover (no coarse pointer)
    if (window.matchMedia && window.matchMedia("(hover: hover)").matches) showTip(w);
  }});
  document.addEventListener("mouseout", (ev) => {{
    const w = ev.target.closest(".w");
    if (!w) return;
    const to = ev.relatedTarget && ev.relatedTarget.closest && ev.relatedTarget.closest(".w");
    if (to === w) return;
    if (window.matchMedia && window.matchMedia("(hover: hover)").matches) hideTipSoon();
  }});
}}

function applyFilter() {{
  const s = q.value.trim().toLowerCase();
  const rows = [...tb.rows];
  let shown = 0;
  let sectionHit = false;
  let subHit = false;
  for (const tr of rows) {{
    if (tr.classList.contains("section")) {{
      sectionHit = !s || tr.innerText.toLowerCase().includes(s);
      subHit = false;
      continue;
    }}
    if (tr.classList.contains("subsec")) {{
      subHit = !s || tr.innerText.toLowerCase().includes(s);
      continue;
    }}
    const text = (tr.dataset.text || "").toLowerCase();
    const adjOk = !adjOnly || tr.dataset.adj === "1";
    const hit = adjOk && (!s || text.includes(s) || sectionHit || subHit);
    tr.style.display = hit ? "" : "none";
    if (hit) shown++;
  }}
  for (let i = 0; i < rows.length; i++) {{
    const tr = rows[i];
    if (!tr.classList.contains("subsec")) continue;
    let any = false;
    for (let j = i + 1; j < rows.length; j++) {{
      if (rows[j].classList.contains("section") || rows[j].classList.contains("subsec")) break;
      if (rows[j].style.display !== "none") {{ any = true; break; }}
    }}
    tr.style.display = any ? "" : "none";
  }}
  for (let i = 0; i < rows.length; i++) {{
    const tr = rows[i];
    if (!tr.classList.contains("section")) continue;
    let any = false;
    for (let j = i + 1; j < rows.length; j++) {{
      if (rows[j].classList.contains("section")) break;
      if (rows[j].classList.contains("verb") && rows[j].style.display !== "none") {{
        any = true; break;
      }}
    }}
    tr.style.display = any ? "" : "none";
  }}
  nEl.textContent = shown;
  document.querySelectorAll(".badge-adj").forEach(b => b.classList.toggle("active", adjOnly));
}}

function markPreset() {{
  const cur = sortState.join(",");
  document.querySelectorAll("button.preset").forEach(btn => {{
    btn.classList.toggle("active", btn.dataset.sort === cur);
  }});
}}

q.addEventListener("input", applyFilter);

document.querySelectorAll("button.preset").forEach(btn => {{
  btn.addEventListener("click", () => {{
    const [a, b, c] = btn.dataset.sort.split(",");
    setSort(a, b, c);
    render();
  }});
}});

wireDelegates();
renderGroupChips();
renderLevelChips();
render();
}} catch (e) {{
  const err = document.getElementById("err");
  if (err) {{
    err.style.display = "block";
    err.textContent = "Could not load the verb table in this browser. "
      + "Make sure you transferred the complete HTML file (about 1 MB). "
      + "Details: " + (e && e.message ? e.message : String(e));
  }}
  console.error(e);
}}
</script>
</body>
</html>
"""
    html = (
        html.replace("__DATA_JSON__", data_json)
        .replace("__GROUPS_JSON__", groups_json)
        .replace("__LEVELS_JSON__", levels_json)
        .replace("__GLOSSARY_JSON__", glossary_json)
    )
    html_path = Path(
        r"c:\Users\AmyCheung\Downloads\500-portuguese-verbs-conjugations.html"
    )
    html_path.write_text(html, encoding="utf-8")
    Path(r"c:\Users\AmyCheung\CursorProjects\500-portuguese-verbs-conjugations.html").write_text(
        html, encoding="utf-8"
    )

    print(f"Wrote {len(rows)} rows in {len(GROUPS)} groups (interactive HTML)")
    print(f"CSV/HTML/JSON in Downloads + CursorProjects")
    print(f"Errors: {len(errors)}")
    for err in errors[:20]:
        print(" ERR", err)
    print(f"Predicted (ML): {len(predicted)}", predicted[:40])
    from collections import Counter
    lc = Counter(r["level"] for r in rows)
    print("Levels:", {k: lc[k] for k in LEVEL_ORDER})


if __name__ == "__main__":
    main()
