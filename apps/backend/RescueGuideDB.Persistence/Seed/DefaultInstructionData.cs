namespace RescueGuideDB.Persistence.Seed;

/// <summary>Vordefinierte Maßnahme (Schritt-für-Schritt-Anleitung für Laienhelfer).</summary>
public sealed record SeedMeasure(string Name, string Description, string[] Tags);

/// <summary>Vordefinierter Plan: verweist per Name auf Maßnahmen, in Ausführungsreihenfolge.</summary>
public sealed record SeedPlan(string Name, string[] Tags, string[] MeasureNames);

/// <summary>
/// Realistische Standard-Maßnahmen und -Pläne für typische Notfallszenarien.
/// Inhalte orientieren sich an den Erste-Hilfe-Empfehlungen für Laien
/// (European Resuscitation Council, Österreichisches Rotes Kreuz).
/// Die Anweisungen sind direkt an den Ersthelfer gerichtet, der per Video mit der Leitstelle verbunden ist.
/// </summary>
public static class DefaultInstructionData
{
    public const string Author = "RescueGuide";

    // ── Maßnahmen-Namen (als Konstanten, damit Pläne typsicher darauf verweisen) ──
    public const string Eigenschutz = "Eigenschutz & Notfallstelle sichern";
    public const string BewusstseinPruefen = "Bewusstsein prüfen";
    public const string AtmungPruefen = "Atemwege freimachen & Atmung prüfen";
    public const string HelferAed = "Helfer organisieren & Defibrillator holen lassen";
    public const string Herzdruckmassage = "Herzdruckmassage (Erwachsene)";
    public const string Beatmung = "Beatmung (Erwachsene)";
    public const string AedAnwenden = "Defibrillator (AED) anwenden";
    public const string ReanimationFortsetzen = "Reanimation ohne Unterbrechung fortsetzen";
    public const string StabileSeitenlage = "Stabile Seitenlage";
    public const string AtmungUeberwachen = "Atmung überwachen & Wärme erhalten";
    public const string WundeAbdruecken = "Blutung durch direkten Druck stoppen";
    public const string Druckverband = "Druckverband anlegen";
    public const string Abbinden = "Abbinden bei nicht stillbarer Blutung (Arm/Bein)";
    public const string Schockbekaempfung = "Schock vorbeugen & Betroffene betreuen";
    public const string BrandLoeschen = "Brennende Person löschen & aus Gefahr bringen";
    public const string VerbrennungKuehlen = "Verbrennung kühlen";
    public const string BrandwundeAbdecken = "Brandwunde keimfrei abdecken";
    public const string HustenAuffordern = "Zum kräftigen Husten auffordern";
    public const string Rueckenschlaege = "Schläge zwischen die Schulterblätter";
    public const string Oberbauchkompression = "Oberbauchkompression (Heimlich-Handgriff)";
    public const string OberkoerperHochlagern = "Oberkörper hochlagern & beengende Kleidung öffnen";
    public const string Betreuen = "Beruhigen & nicht allein lassen";
    public const string FastTest = "Schlaganfall-Schnelltest (FAST)";
    public const string ZeitpunktMerken = "Zeitpunkt des Symptombeginns merken";

    public static readonly IReadOnlyList<SeedMeasure> Measures =
    [
        // ── Basis-Maßnahmen ────────────────────────────────────────────────
        new(Eigenschutz,
            """
            1. Achten Sie zuerst auf Ihre eigene Sicherheit – bringen Sie sich nicht selbst in Gefahr.
            2. Bei Verkehrsunfällen: Warnblinkanlage einschalten, Warnweste anziehen, Pannendreieck aufstellen.
            3. Gefahrenquellen beseitigen, z. B. Strom abschalten oder Motor abstellen.
            4. Ziehen Sie wenn möglich Einmalhandschuhe an.
            5. Bringen Sie die Person nur aus dem Gefahrenbereich, wenn sie dort akut bedroht ist.
            """,
            ["Basis", "Sicherheit"]),

        new(BewusstseinPruefen,
            """
            1. Knien Sie sich neben die Person.
            2. Sprechen Sie sie laut an: „Hallo, hören Sie mich?“
            3. Fassen Sie sie an den Schultern und rütteln Sie sanft.
            4. Reagiert die Person nicht, ist sie bewusstlos – sagen Sie es der Leitstelle sofort.
            """,
            ["Basis", "Bewusstsein"]),

        new(AtmungPruefen,
            """
            1. Legen Sie die Person auf den Rücken.
            2. Legen Sie eine Hand auf die Stirn, zwei Finger der anderen Hand unter das Kinn.
            3. Kopf vorsichtig nach hinten neigen und das Kinn anheben.
            4. Beugen Sie sich mit Ihrem Ohr über Mund und Nase und schauen Sie Richtung Brustkorb.
            5. Sehen, hören und fühlen Sie höchstens 10 Sekunden lang, ob die Person normal atmet.
            6. Nur Schnappatmung oder unsicher? Dann wie „keine normale Atmung“ behandeln.
            """,
            ["Basis", "Atmung"]),

        new(HelferAed,
            """
            1. Rufen Sie laut um Hilfe und machen Sie Umstehende auf sich aufmerksam.
            2. Sprechen Sie eine Person direkt an: „Sie, bitte holen Sie den Defibrillator!“
            3. Defibrillatoren (AED) hängen oft in Eingängen, Geschäften, Bahnhöfen – grünes Schild mit Herz und Blitz.
            4. Weitere Helfer sollen die Rettung einweisen und Türen offen halten.
            """,
            ["Basis", "Reanimation"]),

        // ── Reanimation ────────────────────────────────────────────────────
        new(Herzdruckmassage,
            """
            1. Person liegt flach auf dem Rücken auf hartem Untergrund (Boden).
            2. Oberkörper freimachen. Knien Sie seitlich neben dem Brustkorb.
            3. Handballen auf die Mitte der Brust (untere Hälfte des Brustbeins), zweite Hand darauf legen.
            4. Arme gestreckt, Schultern senkrecht über den Händen.
            5. 30-mal kräftig drücken: 5–6 cm tief, 100–120-mal pro Minute.
            6. Nach jedem Druck den Brustkorb vollständig entlasten, Hände bleiben aufgelegt.
            """,
            ["Reanimation", "Kreislauf"]),

        new(Beatmung,
            """
            1. Kopf nach hinten neigen, Kinn anheben.
            2. Nase mit Daumen und Zeigefinger verschließen.
            3. Normal einatmen, Lippen fest um den Mund der Person legen.
            4. Etwa 1 Sekunde gleichmäßig einblasen, bis sich der Brustkorb hebt.
            5. Ein zweites Mal beatmen – danach sofort wieder 30-mal drücken.
            6. Trauen Sie sich das Beatmen nicht zu? Dann ohne Pause durchgehend drücken.
            """,
            ["Reanimation", "Atmung"]),

        new(AedAnwenden,
            """
            1. Sobald der Defibrillator da ist: Gerät einschalten bzw. Deckel öffnen.
            2. Folgen Sie genau den Sprachanweisungen des Geräts.
            3. Elektroden laut Abbildung kleben: unter das rechte Schlüsselbein und links seitlich unter die Achsel.
            4. Herzdruckmassage weiterführen, bis das Gerät zur Analyse auffordert.
            5. Während Analyse und Schock: Niemand berührt die Person!
            6. Nach dem Schock sofort wieder mit der Herzdruckmassage beginnen.
            """,
            ["Reanimation", "Kreislauf"]),

        new(ReanimationFortsetzen,
            """
            1. Wechseln Sie weiter ab: 30-mal drücken, 2-mal beatmen.
            2. Sind weitere Helfer da, wechseln Sie sich etwa alle 2 Minuten beim Drücken ab.
            3. Unterbrechen Sie das Drücken so kurz wie möglich.
            4. Hören Sie erst auf, wenn der Rettungsdienst übernimmt oder die Person sich deutlich bewegt und normal atmet.
            """,
            ["Reanimation", "Kreislauf"]),

        // ── Bewusstlos mit normaler Atmung ─────────────────────────────────
        new(StabileSeitenlage,
            """
            1. Knien Sie seitlich neben der Person, Brille abnehmen.
            2. Den Arm auf Ihrer Seite im rechten Winkel nach oben legen, Handfläche nach oben.
            3. Den anderen Arm über die Brust führen, Handrücken an die Wange auf Ihrer Seite legen und festhalten.
            4. Das gegenüberliegende Knie aufstellen.
            5. Am Knie ziehen und die Person zu sich herüberrollen.
            6. Das oben liegende Bein so ausrichten, dass Hüfte und Knie rechtwinklig gebeugt sind.
            7. Kopf leicht nach hinten neigen, Mund öffnen – Mund ist der tiefste Punkt.
            """,
            ["Bewusstsein", "Atmung"]),

        new(AtmungUeberwachen,
            """
            1. Bleiben Sie bei der Person.
            2. Kontrollieren Sie etwa jede Minute, ob sie weiterhin normal atmet.
            3. Zudecken (z. B. Jacke, Rettungsdecke), um Auskühlung zu vermeiden.
            4. Atmet die Person nicht mehr normal: auf den Rücken drehen und sofort mit der Herzdruckmassage beginnen.
            """,
            ["Bewusstsein", "Atmung"]),

        // ── Starke Blutung ─────────────────────────────────────────────────
        new(WundeAbdruecken,
            """
            1. Ziehen Sie wenn möglich Einmalhandschuhe an.
            2. Betroffene Person hinsetzen oder hinlegen lassen.
            3. Den verletzten Arm bzw. das Bein hochhalten.
            4. Mit einer Wundauflage oder einem sauberen Tuch fest direkt auf die Wunde drücken.
            5. Den Druck nicht lockern, bis ein Druckverband angelegt ist.
            """,
            ["Blutung", "Trauma"]),

        new(Druckverband,
            """
            1. Sterile Wundauflage direkt auf die Wunde legen.
            2. Mit einer Binde zwei- bis dreimal fest umwickeln.
            3. Ein Druckpolster (z. B. ungeöffnete Verbandspäckchen) genau über die Wunde legen.
            4. Das Polster mit weiteren Bindentouren straff einwickeln und das Ende fixieren.
            5. Prüfen: Finger bzw. Zehen dürfen sich nicht blau verfärben oder taub werden.
            6. Blutet es durch, einen zweiten Druckverband darüber anlegen.
            """,
            ["Blutung", "Trauma"]),

        new(Abbinden,
            """
            Nur wenn die Blutung an Arm oder Bein trotz Druckverband nicht stoppt:
            1. Tourniquet oder breites Dreiecktuch handbreit oberhalb der Wunde anlegen – nie über einem Gelenk.
            2. Mit einem Knebel (z. B. Stift, Stock) so fest zudrehen, bis die Blutung steht.
            3. Knebel fixieren, das Abbinden NICHT mehr lösen.
            4. Merken Sie sich die Uhrzeit und sagen Sie sie der Leitstelle.
            """,
            ["Blutung", "Trauma"]),

        new(Schockbekaempfung,
            """
            1. Person flach hinlegen, beruhigend zusprechen.
            2. Beine leicht anheben – nur wenn Beine, Becken und Wirbelsäule unverletzt sind.
            3. Zudecken (Rettungsdecke, Jacke), vor Kälte von unten schützen.
            4. Nichts zu essen oder zu trinken geben.
            5. Bleiben Sie bei der Person und achten Sie auf Bewusstsein und Atmung.
            """,
            ["Schock", "Kreislauf"]),

        // ── Verbrennung ────────────────────────────────────────────────────
        new(BrandLoeschen,
            """
            1. Achten Sie auf Ihre eigene Sicherheit (Flammen, Rauch, Strom).
            2. Brennende Kleidung sofort löschen: Person auf dem Boden wälzen oder mit einer Decke ersticken – nicht über den Kopf.
            3. Alternativ mit Wasser oder Feuerlöscher löschen (nicht ins Gesicht).
            4. Person aus dem Gefahrenbereich bringen.
            5. Nicht eingebrannte Kleidung und Schmuck vorsichtig entfernen.
            """,
            ["Verbrennung", "Sicherheit"]),

        new(VerbrennungKuehlen,
            """
            1. Die verbrannte Stelle sofort unter fließendes, handwarmes Leitungswasser halten (ca. 20 °C).
            2. Etwa 10–20 Minuten kühlen bzw. bis der Schmerz nachlässt.
            3. Kein Eis, keine Kühlakkus direkt auf die Haut.
            4. Bei großflächigen Verbrennungen und bei Kindern nur kurz kühlen – Gefahr der Unterkühlung.
            5. Die Person nicht frieren lassen, unverletzte Körperteile warm halten.
            """,
            ["Verbrennung"]),

        new(BrandwundeAbdecken,
            """
            1. Die Wunde locker mit einer sterilen Wundauflage oder einem Brandwundenverbandtuch abdecken.
            2. Keine Hausmittel wie Mehl, Öl, Salben oder Zahnpasta auftragen.
            3. Brandblasen nicht öffnen.
            4. Festgeklebte Kleidung nicht abziehen, sondern umschneiden.
            5. Person zudecken und bis zum Eintreffen der Rettung betreuen.
            """,
            ["Verbrennung", "Trauma"]),

        // ── Ersticken ──────────────────────────────────────────────────────
        new(HustenAuffordern,
            """
            1. Fragen Sie: „Haben Sie sich verschluckt?“
            2. Kann die Person noch sprechen, husten und atmen: kräftig weiterhusten lassen.
            3. Nicht auf den Rücken klopfen, solange das Husten wirksam ist.
            4. Wird das Husten schwächer oder kann die Person nicht mehr atmen: sofort Schläge zwischen die Schulterblätter.
            """,
            ["Ersticken", "Atmung"]),

        new(Rueckenschlaege,
            """
            1. Stellen Sie sich seitlich hinter die Person.
            2. Oberkörper mit einer Hand an der Brust stützen und weit nach vorne beugen.
            3. Mit dem Handballen bis zu 5-mal kräftig zwischen die Schulterblätter schlagen.
            4. Nach jedem Schlag prüfen, ob der Fremdkörper herausgekommen ist.
            """,
            ["Ersticken", "Atmung"]),

        new(Oberbauchkompression,
            """
            1. Stellen Sie sich hinter die Person, beide Arme um ihren Oberbauch legen.
            2. Person leicht nach vorne beugen.
            3. Eine Faust zwischen Nabel und Brustbeinspitze legen, mit der anderen Hand umfassen.
            4. Kräftig ruckartig nach innen und oben ziehen – bis zu 5-mal.
            5. Weiterhin abwechselnd 5 Rückenschläge und 5 Oberbauchkompressionen.
            6. Wird die Person bewusstlos: vorsichtig hinlegen und sofort mit der Herzdruckmassage beginnen.
            """,
            ["Ersticken", "Atmung"]),

        // ── Herz & Schlaganfall ────────────────────────────────────────────
        new(OberkoerperHochlagern,
            """
            1. Person hinsetzen bzw. mit erhöhtem Oberkörper lagern (z. B. an eine Wand gelehnt).
            2. Beengende Kleidung öffnen: Krawatte, Kragen, Gürtel.
            3. Für frische Luft sorgen, Person jede körperliche Anstrengung vermeiden lassen.
            4. Nimmt die Person eigene Notfallmedikamente, beim Einnehmen helfen.
            """,
            ["Herz", "Kreislauf"]),

        new(Betreuen,
            """
            1. Sprechen Sie ruhig mit der Person und erklären Sie, dass Hilfe unterwegs ist.
            2. Lassen Sie die Person nicht allein.
            3. Nichts zu essen oder zu trinken geben.
            4. Achten Sie ständig auf Bewusstsein und Atmung und melden Sie Veränderungen der Leitstelle.
            """,
            ["Basis", "Kreislauf"]),

        new(FastTest,
            """
            F – Face (Gesicht): Bitten Sie die Person zu lächeln. Hängt ein Mundwinkel?
            A – Arms (Arme): Beide Arme gleichzeitig nach vorne strecken lassen. Sinkt ein Arm ab?
            S – Speech (Sprache): Einen einfachen Satz nachsprechen lassen. Ist die Sprache verwaschen?
            T – Time (Zeit): Ist eines davon auffällig, zählt jede Minute – sagen Sie es sofort der Leitstelle.
            """,
            ["Schlaganfall", "Bewusstsein"]),

        new(ZeitpunktMerken,
            """
            1. Fragen Sie die Person oder Angehörige, wann die Beschwerden begonnen haben.
            2. Merken bzw. notieren Sie die genaue Uhrzeit.
            3. Wann wurde die Person zuletzt ohne Beschwerden gesehen?
            4. Diese Information ist für die Behandlung im Krankenhaus entscheidend.
            """,
            ["Schlaganfall"]),
    ];

    public static readonly IReadOnlyList<SeedPlan> Plans =
    [
        new("Reanimation Erwachsene (Herz-Lungen-Wiederbelebung)",
            ["Reanimation", "Kreislauf"],
            [Eigenschutz, BewusstseinPruefen, AtmungPruefen, HelferAed, Herzdruckmassage, Beatmung, AedAnwenden, ReanimationFortsetzen]),

        new("Bewusstlos mit normaler Atmung",
            ["Bewusstsein", "Atmung"],
            [Eigenschutz, BewusstseinPruefen, AtmungPruefen, StabileSeitenlage, AtmungUeberwachen]),

        new("Starke Blutung",
            ["Blutung", "Trauma"],
            [Eigenschutz, WundeAbdruecken, Druckverband, Abbinden, Schockbekaempfung]),

        new("Verbrennung / Verbrühung",
            ["Verbrennung"],
            [BrandLoeschen, VerbrennungKuehlen, BrandwundeAbdecken, Schockbekaempfung]),

        new("Ersticken durch Fremdkörper (Erwachsene)",
            ["Ersticken", "Atmung"],
            [HustenAuffordern, Rueckenschlaege, Oberbauchkompression]),

        new("Verdacht auf Herzinfarkt",
            ["Herz", "Kreislauf"],
            [OberkoerperHochlagern, Betreuen, HelferAed]),

        new("Verdacht auf Schlaganfall",
            ["Schlaganfall"],
            [FastTest, ZeitpunktMerken, OberkoerperHochlagern, Betreuen]),
    ];
}
