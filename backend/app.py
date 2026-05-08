"""
SentimentScope — app.py (v3)
Upgraded: avg_score, dynamic recommendations, confidence score, posts endpoint
"""
import json, re, math
from datetime import datetime
from collections import Counter, defaultdict
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

print("[startup] Loading processed_data.json …", flush=True)
with open("data/processed_data.json", encoding="utf-8") as f:
    DATA = json.load(f)
RECORDS = DATA["records"]
print(f"[startup] {len(RECORDS):,} records ready.", flush=True)

STOPWORDS = set("a about above after again against all am an and any are as at be because been before being below between both but by can cannot could did do does doing down during each few for from further get got had has have having he her here hers herself him himself his how i if in into is it its itself just let me more most my myself no nor not of off on once only or other our ours out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who why will with would you your yours yourself yourselves rt http https www co amp lol omg im got ya like oh".split())
POS_WORDS = set("good great love liked best better amazing awesome wonderful excellent fantastic happy glad excited joy joyful fun brilliant superb perfect thank thanks grateful appreciate win success beautiful hope enjoy nice sweet cool outstanding".split())
NEG_WORDS = set("bad worse worst hate hated awful terrible horrible sad upset angry mad frustrated annoying disappointed fail failed loss broken hurt pain cry miss sorry afraid fear stressed anxious worry depressed sick tired exhausted bored lonely problem issue wrong".split())

# ── Helpers ───────────────────────────────────────────────────
def filter_records(keyword=None, region=None, sentiment=None):
    r = RECORDS
    if keyword and keyword != "all":
        kl = keyword.lower()
        r = [x for x in r if kl in x.get("keyword","") or kl in x.get("cleaned_text","")]
    if region and region != "all":
        r = [x for x in r if x.get("region","").lower() == region.lower()]
    if sentiment and sentiment != "all":
        r = [x for x in r if x.get("sentiment_label","").lower() == sentiment.lower()]
    return r

def compute_meta(records):
    total = len(records)
    if not total:
        return {"total":0,"positive":0,"negative":0,"neutral":0,"pos_pct":0,"neg_pct":0,"neu_pct":0,"avg_score":0}
    pos = sum(1 for r in records if r["sentiment_label"]=="Positive")
    neg = sum(1 for r in records if r["sentiment_label"]=="Negative")
    neu = total - pos - neg
    avg_score = sum(r.get("sentiment_score",0) for r in records) / total
    return {
        "total":total,"positive":pos,"negative":neg,"neutral":neu,
        "pos_pct":round(pos/total*100,1),"neg_pct":round(neg/total*100,1),"neu_pct":round(neu/total*100,1),
        "avg_score":round(avg_score,4),
    }

def build_date_series(records, period="monthly"):
    buckets = defaultdict(lambda:{"Positive":0,"Negative":0,"Neutral":0})
    for r in records:
        d = r.get("date","")
        if not d: continue
        try:
            dt = datetime.strptime(d,"%Y-%m-%d")
            key = d if period=="daily" else (dt.strftime("%Y-W%U") if period=="weekly" else dt.strftime("%Y-%m"))
            buckets[key][r["sentiment_label"]] += 1
        except: pass
    return dict(sorted(buckets.items()))

def top_words(records, n=50):
    c = Counter()
    for r in records:
        for t in r.get("tokens",[]):
            if t not in STOPWORDS and len(t)>2: c[t]+=1
    return c.most_common(n)

def detect_anomalies(ds):
    if not ds: return []
    vals = [v["Negative"] for v in ds.values()]
    avg  = sum(vals)/max(len(vals),1)
    std  = math.sqrt(sum((x-avg)**2 for x in vals)/max(len(vals),1))
    thr  = avg + 1.5*std
    return [{"date":d,"negative_count":v["Negative"],"positive_count":v["Positive"],"total":sum(v.values()),"spike_factor":round(v["Negative"]/max(avg,1),2),"z_score":round((v["Negative"]-avg)/max(std,1),2)}
            for d,v in ds.items() if v["Negative"]>thr]

def generate_insights_and_recs(records, meta, top_words_list, anomalies):
    pos_pct = meta["pos_pct"]; neg_pct = meta["neg_pct"]; neu_pct = meta["neu_pct"]
    total   = meta["total"];   avg     = meta.get("avg_score",0)

    insights = []
    recs     = []

    if not total:
        return [{"type":"info","icon":"ℹ️","text":"No data for current filters."}], [], 50

    # ── INSIGHTS (sharp, data-driven, ≤5) ──────────────────────
    # 1. Dominant signal
    if neg_pct > 35:
        insights.append({"type":"alert","icon":"🚨","text":f"Negative at {neg_pct}% — significantly elevated. Needs immediate review."})
    elif pos_pct > 40:
        insights.append({"type":"positive","icon":"✅","text":f"Positive sentiment at {pos_pct}% — audience is responding well."})
    else:
        insights.append({"type":"neutral","icon":"📊","text":f"Neutral dominates at {neu_pct}% — low emotional engagement, content may lack resonance."})

    # 2. Compound score
    score_label = "mildly positive" if avg>0.05 else "mildly negative" if avg<-0.05 else "neutral"
    insights.append({"type":"trend","icon":"📈","text":f"Avg compound score: {avg:+.3f} ({score_label}). Range −1.0 to +1.0."})

    # 3. Top positive driver
    pos_drivers = [w for w,_ in top_words_list if w in POS_WORDS][:4]
    if pos_drivers:
        insights.append({"type":"positive","icon":"✅","text":f"Positive signal driven by: {', '.join(pos_drivers)}."})

    # 4. Top negative driver
    neg_drivers = [w for w,_ in top_words_list if w in NEG_WORDS][:4]
    if neg_drivers:
        insights.append({"type":"alert","icon":"⚠️","text":f"Negative signal tied to: {', '.join(neg_drivers)}."})

    # 5. Anomaly
    if anomalies:
        worst = max(anomalies, key=lambda a:a["spike_factor"])
        insights.append({"type":"alert","icon":"📉","text":f"Spike on {worst['date']}: {worst['negative_count']} negative posts ({worst['spike_factor']}× avg)."})

    # ── RECOMMENDATIONS (dynamic, context-aware, ≤4) ────────────
    if neg_pct > 30:
        recs.append({"icon":"🚨","text":f"Negative at {neg_pct}% — prioritise response to critical posts within 2 hours."})
    else:
        recs.append({"icon":"📅","text":f"Set daily alerts if negative crosses 25% (currently {neg_pct}%)."})

    if pos_drivers:
        recs.append({"icon":"📢","text":f"Amplify '{pos_drivers[0]}' and '{pos_drivers[1] if len(pos_drivers)>1 else pos_drivers[0]}' in campaign messaging — top positive signals."})
    else:
        recs.append({"icon":"💬","text":"Identify and amplify emerging positive keywords in your content strategy."})

    if neu_pct > 50:
        recs.append({"icon":"🎯","text":f"{neu_pct}% neutral posts — use targeted calls-to-action to convert neutral readers into advocates."})
    else:
        recs.append({"icon":"🎯","text":"Engagement is emotionally active — maintain momentum with consistent content cadence."})

    if anomalies:
        worst = max(anomalies, key=lambda a:a["spike_factor"])
        recs.append({"icon":"🔍","text":f"Investigate {worst['date']} spike — tie to external event and build early warning trigger."})
    else:
        recs.append({"icon":"📊","text":"No major spikes detected. Maintain monitoring — set threshold alerts for sustained changes."})

    # Confidence: based on sample size + score consistency
    conf = min(95, 50 + min(total // 100, 30) + (10 if not anomalies else 0) + (5 if abs(avg) > 0.05 else 0))

    return insights[:5], recs[:4], conf

# ── Routes ────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return jsonify({"status":"ok","records":len(RECORDS)})

@app.route("/api/overview")
def overview():
    kw = request.args.get("keyword","all"); reg = request.args.get("region","all"); s = request.args.get("sentiment","all")
    records = filter_records(kw, reg, s)
    meta    = compute_meta(records)
    kw_c    = Counter(r.get("keyword","general") for r in records)
    meta["trending_topic"] = "#" + (kw_c.most_common(1)[0][0].title() if kw_c else "General")
    meta["generated_at"]   = datetime.utcnow().isoformat()+"Z"
    return jsonify(meta)

@app.route("/api/trends")
def trends():
    period = request.args.get("period","monthly")
    records = filter_records(request.args.get("keyword","all"), request.args.get("region","all"))
    ds = build_date_series(records, period)
    labels = list(ds.keys())
    return jsonify({"period":period,"labels":labels,"positive":[ds[d]["Positive"] for d in labels],"negative":[ds[d]["Negative"] for d in labels],"neutral":[ds[d]["Neutral"] for d in labels]})

@app.route("/api/keywords")
def keywords():
    records = filter_records(region=request.args.get("region","all"))
    kw = defaultdict(lambda:{"count":0,"Positive":0,"Negative":0,"Neutral":0})
    for r in records:
        k = r.get("keyword","general"); kw[k]["count"]+=1; kw[k][r["sentiment_label"]]+=1
    return jsonify(sorted([{"keyword":k,**v} for k,v in kw.items()],key=lambda x:-x["count"]))

@app.route("/api/regions")
def regions():
    records = filter_records(keyword=request.args.get("keyword","all"))
    rd = defaultdict(lambda:{"Positive":0,"Negative":0,"Neutral":0})
    for r in records: rd[r.get("region","Unknown")][r["sentiment_label"]]+=1
    result=[]
    for reg,counts in rd.items():
        total=sum(counts.values())
        result.append({"region":reg,"total":total,**counts,"pos_pct":round(counts["Positive"]/total*100,1)if total else 0,"neg_pct":round(counts["Negative"]/total*100,1)if total else 0})
    return jsonify(sorted(result,key=lambda x:-x["total"]))

@app.route("/api/wordcloud")
def wordcloud():
    records = filter_records(request.args.get("keyword","all"), request.args.get("region","all"))
    return jsonify([{"word":w,"count":c} for w,c in top_words(records,60)])

@app.route("/api/insights")
def insights():
    records = filter_records(request.args.get("keyword","all"), request.args.get("region","all"))
    meta    = compute_meta(records)
    tw      = top_words(records,80)
    ds      = build_date_series(records,"daily")
    anom    = detect_anomalies(ds)
    ins, recs, conf = generate_insights_and_recs(records, meta, tw, anom)
    # Sample posts: one per sentiment label, meaningful score
    sample_posts = []
    for label in ["Negative","Positive","Neutral"]:
        candidates = [r for r in records if r["sentiment_label"]==label and abs(r.get("sentiment_score",0))>0.05 and len(r.get("cleaned_text",""))>20]
        if candidates:
            import random
            pick = random.choice(candidates[:50])
            sample_posts.append({"cleaned_text":pick["cleaned_text"],"sentiment_label":pick["sentiment_label"],"sentiment_score":pick.get("sentiment_score",0),"keyword":pick.get("keyword","general")})
    return jsonify({"insights":ins,"recommendations":recs,"confidence":conf,"sample_posts":sample_posts})

@app.route("/api/anomalies")
def anomalies():
    records = filter_records(request.args.get("keyword","all"), request.args.get("region","all"))
    ds = build_date_series(records,"daily")
    return jsonify(sorted(detect_anomalies(ds),key=lambda x:-x["spike_factor"])[:10])

@app.route("/api/analyze")
def analyze():
    q      = request.args.get("q","").strip().lower()
    region = request.args.get("region","all")
    limit  = int(request.args.get("limit",200))
    records = filter_records(keyword=q if q else "all", region=region)
    if q and q != "all":
        records = [r for r in records if q in r.get("cleaned_text","") or q in r.get("keyword","")]
    meta    = compute_meta(records)
    tw      = top_words(records,50)
    ds      = build_date_series(records,"monthly")
    anom    = detect_anomalies(ds)
    ins, recs, conf = generate_insights_and_recs(records, meta, tw, anom)
    kw_c    = Counter(r.get("keyword","general") for r in records)
    meta["trending_topic"] = "#" + (kw_c.most_common(1)[0][0].title() if kw_c else "General")
    labels  = list(ds.keys())
    rd      = defaultdict(lambda:{"Positive":0,"Negative":0,"Neutral":0})
    for r in records: rd[r.get("region","Unknown")][r["sentiment_label"]]+=1
    regions_out = sorted([{"region":rg,"total":sum(c.values()),**c} for rg,c in rd.items()],key=lambda x:-x["total"])
    return jsonify({
        "query":q,"meta":meta,
        "trends":{"labels":labels,"positive":[ds[d]["Positive"] for d in labels],"negative":[ds[d]["Negative"] for d in labels],"neutral":[ds[d]["Neutral"] for d in labels]},
        "wordcloud":[{"word":w,"count":c} for w,c in tw],
        "insights":{"insights":ins,"recommendations":recs,"confidence":conf},
        "regions":regions_out,"anomalies":anom[:5],
        "sample_records":records[:limit],
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)