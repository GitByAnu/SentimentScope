"""
SentimentScope — process_data.py
Offline preprocessing pipeline:
  1. Load raw CSV
  2. Clean & standardize
  3. Augment to 10 000+ rows
  4. Run VADER sentiment
  5. Extract keywords
  6. Assign regions + timestamps
  7. Write backend/data/processed_data.json  (used by app.py at startup)
"""

import csv, json, re, random, math
from datetime import datetime, timedelta
from collections import Counter

# ──────────────────────────────────────────────────────────────
# STOPWORDS (lightweight — no NLTK needed)
# ──────────────────────────────────────────────────────────────
STOPWORDS = set("""
a about above after again against all am an and any are aren't as at be because
been before being below between both but by can't cannot could couldn't did didn't
do does doesn't doing don't down during each few for from further get got had
hadn't has hasn't have haven't having he he'd he'll he's her here here's hers
herself him himself his how how's i i'd i'll i'm i've if in into is isn't it
it's its itself just let's me more most mustn't my myself no nor not of off on
once only or other ought our ours ourselves out over own same shan't she she'd
she'll she's should shouldn't so some such than that that's the their theirs them
themselves then there there's these they they'd they'll they're they've this those
through to too under until up very was wasn't we we'd we'll we're we've were
weren't what what's when when's where where's which while who who's whom why
will with won't would wouldn't you you'd you'll you're you've your yours yourself
yourselves rt http https www co amp lol omg im got ya just like oh
""".split())

# ──────────────────────────────────────────────────────────────
# REGIONS
# ──────────────────────────────────────────────────────────────
REGIONS = [
    "North America", "Europe", "Asia Pacific",
    "Latin America", "Middle East", "South Asia"
]
REGION_WEIGHTS = [0.35, 0.25, 0.18, 0.10, 0.07, 0.05]

# ──────────────────────────────────────────────────────────────
# VADER (pure-Python minimal implementation)
# ──────────────────────────────────────────────────────────────
POS_WORDS = set("""
good great love loved loving like liked best better amazing awesome wonderful
excellent fantastic happy glad excited joy joyful fun fantastic brilliant superb
perfect thank thanks grateful appreciate win winning success successful beautiful
hope hopeful enjoy enjoyed enjoying nice sweet cool wonderful brilliant outstanding
""".split())

NEG_WORDS = set("""
bad worse worst hate hated hating awful terrible horrible sad upset angry mad
frustrated frustrating annoying annoyed disappointed disappointing fail failed
failing loss lost broken broke hurt pain cry crying miss missed missing sorry
afraid fear scared stressed stress anxious anxiety worry worried depressed
sick tired exhausted bored lonely alone problem problems issue issues wrong
""".split())

INTENSIFIERS = {"very": 1.3, "really": 1.2, "so": 1.15, "extremely": 1.4,
                "absolutely": 1.35, "totally": 1.25, "super": 1.3}
NEGATORS    = {"not", "no", "never", "n't", "dont", "cant", "wont", "isnt"}


def vader_score(text: str) -> float:
    tokens = re.findall(r"[a-z']+", text.lower())
    score, n = 0.0, 0
    i = 0
    while i < len(tokens):
        t = tokens[i]
        mult = 1.0
        if i > 0 and tokens[i - 1] in INTENSIFIERS:
            mult = INTENSIFIERS[tokens[i - 1]]
        if i > 0 and tokens[i - 1] in NEGATORS:
            mult = -0.8
        if i > 1 and tokens[i - 2] in NEGATORS:
            mult = -0.6
        if t in POS_WORDS:
            score += mult * 1.0
            n += 1
        elif t in NEG_WORDS:
            score += mult * -1.0
            n += 1
        i += 1
    if n == 0:
        return 0.0
    raw = score / math.sqrt(n)
    return max(-1.0, min(1.0, raw))


def label(score: float) -> str:
    if score >= 0.05:
        return "Positive"
    if score <= -0.05:
        return "Negative"
    return "Neutral"


# ──────────────────────────────────────────────────────────────
# TEXT CLEANING
# ──────────────────────────────────────────────────────────────
def clean_text(raw: str) -> str:
    t = raw.lower()
    t = re.sub(r"http\S+|www\S+", "", t)
    t = re.sub(r"@\w+", "", t)
    t = re.sub(r"#(\w+)", r"\1", t)
    t = re.sub(r"[^\w\s']", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def tokenize(text: str):
    return [w for w in text.split() if w not in STOPWORDS and len(w) > 2]


# ──────────────────────────────────────────────────────────────
# DATE HELPERS
# ──────────────────────────────────────────────────────────────
BASE_DATE = datetime(2024, 1, 1)


def parse_date(raw: str) -> datetime:
    try:
        return datetime.strptime(raw.strip(), "%a %b %d %H:%M:%S PDT %Y")
    except Exception:
        pass
    try:
        return datetime.strptime(raw.strip(), "%Y-%m-%d")
    except Exception:
        pass
    return BASE_DATE + timedelta(days=random.randint(0, 364))


def random_date() -> datetime:
    return BASE_DATE + timedelta(
        days=random.randint(0, 364),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59)
    )


# ──────────────────────────────────────────────────────────────
# AUGMENTATION TEMPLATES
# ──────────────────────────────────────────────────────────────
AUG_TEMPLATES = {
    "Positive": [
        "feeling really {adj} today, everything is going well",
        "just had an {adj} experience with this, totally recommend",
        "love how {adj} this turned out, so happy right now",
        "great day ahead, feeling {adj} and motivated",
        "this is {adj}, cannot believe how well it works",
        "so {adj} to see this, made my whole day better",
        "incredibly {adj} results, exceeded all expectations",
        "feeling {adj} and grateful for everything around me",
    ],
    "Negative": [
        "really {adj} situation right now, nothing is working",
        "feeling so {adj} today, everything went wrong",
        "this is {adj} and i cannot deal with it anymore",
        "had the most {adj} experience ever, very disappointed",
        "why is everything so {adj}, this is frustrating",
        "extremely {adj} service, will not be returning",
        "so {adj} about what happened, really upset right now",
        "cannot believe how {adj} this turned out to be",
    ],
    "Neutral": [
        "just finished {action}, nothing special to report",
        "heading out to {action}, same as usual",
        "spent the day {action}, fairly standard routine",
        "worked on {action} today, normal progress",
        "thinking about {action}, not sure what to do",
        "doing {action} as planned, everything on schedule",
        "went ahead with {action}, results are as expected",
        "completed {action}, moving on to next task",
    ],
}
POS_ADJ  = ["amazing","wonderful","fantastic","brilliant","excellent","great","superb","outstanding"]
NEG_ADJ  = ["terrible","awful","horrible","dreadful","disappointing","frustrating","upsetting","bad"]
ACTIONS  = ["the meeting","some work","grocery shopping","studying","errands","chores","reading","cooking"]

KEYWORDS_LIST = [
    "tech", "sports", "music", "politics", "health",
    "travel", "food", "finance", "education", "entertainment",
    "gaming", "fashion", "science", "general", "lifestyle"
]


def generate_augmented_rows(n: int):
    rows = []
    for _ in range(n):
        lbl = random.choices(
            ["Positive", "Negative", "Neutral"],
            weights=[0.28, 0.25, 0.47]
        )[0]
        if lbl == "Positive":
            tmpl = random.choice(AUG_TEMPLATES["Positive"])
            text = tmpl.replace("{adj}", random.choice(POS_ADJ))
        elif lbl == "Negative":
            tmpl = random.choice(AUG_TEMPLATES["Negative"])
            text = tmpl.replace("{adj}", random.choice(NEG_ADJ))
        else:
            tmpl = random.choice(AUG_TEMPLATES["Neutral"])
            text = tmpl.replace("{action}", random.choice(ACTIONS))
        rows.append({
            "raw_text": text,
            "date_raw": random_date(),
            "keyword": random.choice(KEYWORDS_LIST),
            "augmented": True,
        })
    return rows


# ──────────────────────────────────────────────────────────────
# MAIN PIPELINE
# ──────────────────────────────────────────────────────────────
def run():
    print("[ 1/7 ] Loading raw CSV …")
    raw_rows = []
    with open("data/raw_data.csv", newline="", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for r in reader:
            raw_rows.append(r)
    print(f"        Loaded {len(raw_rows)} rows")

    print("[ 2/7 ] Cleaning & deduplicating …")
    seen, clean_rows = set(), []
    for r in raw_rows:
        text = r.get("Text", "").strip()
        if not text or text in seen:
            continue
        seen.add(text)
        clean_rows.append({
            "raw_text": text,
            "date_raw": parse_date(r.get("Date", "")),
            "keyword":  r.get("Keyword", "general").strip().lower() or "general",
            "augmented": False,
        })
    print(f"        {len(clean_rows)} unique rows retained")

    TARGET = 10_000
    if len(clean_rows) < TARGET:
        needed = TARGET - len(clean_rows)
        print(f"[ 3/7 ] Augmenting dataset ({len(clean_rows)} → {TARGET}) …")
        clean_rows.extend(generate_augmented_rows(needed))
    else:
        print(f"[ 3/7 ] Dataset already {len(clean_rows)} rows, skipping augmentation")

    print("[ 4/7 ] Running NLP pipeline …")
    processed = []
    word_counter = Counter()
    date_sentiment = {}   # "YYYY-MM-DD" → {Positive, Negative, Neutral}
    region_sentiment = {} # region → {Positive, Negative, Neutral}
    kw_sentiment = {}     # keyword → {Positive, Negative, Neutral}

    for r in clean_rows:
        ct = clean_text(r["raw_text"])
        tokens = tokenize(ct)
        score = vader_score(ct)
        lbl = label(score)
        wc = len(tokens)

        # Date bucket
        dt = r["date_raw"] if isinstance(r["date_raw"], datetime) else parse_date(str(r["date_raw"]))
        day_str = dt.strftime("%Y-%m-%d")
        ds = date_sentiment.setdefault(day_str, {"Positive": 0, "Negative": 0, "Neutral": 0})
        ds[lbl] += 1

        # Region
        region = random.choices(REGIONS, weights=REGION_WEIGHTS)[0]
        rs = region_sentiment.setdefault(region, {"Positive": 0, "Negative": 0, "Neutral": 0})
        rs[lbl] += 1

        # Keyword bucket
        kw = r["keyword"]
        ks = kw_sentiment.setdefault(kw, {"Positive": 0, "Negative": 0, "Neutral": 0})
        ks[lbl] += 1

        # Word freq (exclude very short / stop)
        for tok in tokens:
            if tok not in STOPWORDS and len(tok) > 2:
                word_counter[tok] += 1

        processed.append({
            "cleaned_text":     ct,
            "sentiment_score":  round(score, 4),
            "sentiment_label":  lbl,
            "word_count":       wc,
            "tokens":           tokens[:20],
            "date":             day_str,
            "region":           region,
            "keyword":          kw,
        })

    print("[ 5/7 ] Computing aggregates …")
    total = len(processed)
    pos_total = sum(1 for p in processed if p["sentiment_label"] == "Positive")
    neg_total = sum(1 for p in processed if p["sentiment_label"] == "Negative")
    neu_total = total - pos_total - neg_total

    top_words = word_counter.most_common(60)

    # Sort date_sentiment by date
    date_sentiment = dict(sorted(date_sentiment.items()))

    print("[ 6/7 ] Building keyword list …")
    keywords = [
        {"keyword": kw, "count": sum(v.values()), **v}
        for kw, v in sorted(kw_sentiment.items(), key=lambda x: -sum(x[1].values()))
    ]

    # Anomaly detection: days where neg > 1.5x daily average
    daily_neg_avg = sum(v["Negative"] for v in date_sentiment.values()) / max(len(date_sentiment), 1)
    anomalies = [
        {"date": d, "negative_count": v["Negative"], "spike_factor": round(v["Negative"] / max(daily_neg_avg, 1), 2)}
        for d, v in date_sentiment.items()
        if v["Negative"] > daily_neg_avg * 1.5
    ]

    # Top keywords per sentiment
    pos_kw = [w for w, _ in word_counter.most_common(200) if w in POS_WORDS][:10]
    neg_kw = [w for w, _ in word_counter.most_common(200) if w in NEG_WORDS][:10]

    print("[ 7/7 ] Writing processed_data.json …")
    output = {
        "meta": {
            "total":        total,
            "positive":     pos_total,
            "negative":     neg_total,
            "neutral":      neu_total,
            "pos_pct":      round(pos_total / total * 100, 1),
            "neg_pct":      round(neg_total / total * 100, 1),
            "neu_pct":      round(neu_total / total * 100, 1),
            "trending_topic": f"#{keywords[0]['keyword'].title()}" if keywords else "#General",
            "generated_at": datetime.utcnow().isoformat() + "Z",
        },
        "date_sentiment":   date_sentiment,
        "region_sentiment": region_sentiment,
        "top_words":        top_words,
        "keywords":         keywords,
        "anomalies":        anomalies[:10],
        "pos_keywords":     pos_kw,
        "neg_keywords":     neg_kw,
        "kw_sentiment":     kw_sentiment,
        "records":          processed,   # full records for /analyze endpoint
    }

    with open("data/processed_data.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False)

    size_mb = len(json.dumps(output)) / 1_048_576
    print(f"\n✅  Done — {total:,} records written to data/processed_data.json ({size_mb:.1f} MB)")
    print(f"    Positive: {pos_total:,} ({output['meta']['pos_pct']}%)")
    print(f"    Negative: {neg_total:,} ({output['meta']['neg_pct']}%)")
    print(f"    Neutral:  {neu_total:,} ({output['meta']['neu_pct']}%)")
    print(f"    Date range: {min(date_sentiment)} → {max(date_sentiment)}")
    print(f"    Regions: {list(region_sentiment.keys())}")
    print(f"    Keywords: {[k['keyword'] for k in keywords]}")
    print(f"    Anomaly spikes detected: {len(anomalies)}")


if __name__ == "__main__":
    run()