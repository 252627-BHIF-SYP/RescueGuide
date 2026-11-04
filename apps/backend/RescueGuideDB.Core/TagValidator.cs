using System.Text.RegularExpressions;

namespace RescueGuideDB.Core;

public static class TagValidator
{
    // Erlaubt nur Buchstaben (Unicode \p{L}: a-z, A-Z, ä, ö, ü, Ä, Ö, Ü, ß etc.)
    private static readonly Regex LetterOnlyRegex = new(@"^\p{L}+$", RegexOptions.Compiled);
    public const int MaxTagLength = 50;

    public static (bool IsValid, string? ErrorMessage) ValidateTags(IEnumerable<string>? tags)
    {
        if (tags == null) return (true, null);

        foreach (var rawTag in tags)
        {
            var tag = rawTag?.Trim();
            if (string.IsNullOrEmpty(tag))
            {
                return (false, "Ein Tag darf nicht leer sein.");
            }

            if (tag.Length > MaxTagLength)
            {
                return (false, $"Der Tag '{tag}' überschreitet die Maximallänge von {MaxTagLength} Zeichen.");
            }

            if (!LetterOnlyRegex.IsMatch(tag))
            {
                return (false, $"Der Tag '{tag}' ist ungültig. Tags dürfen nur aus Buchstaben bestehen (keine Zahlen, Sonderzeichen oder Leerzeichen).");
            }
        }

        return (true, null);
    }

    public static string ToTitleCase(string tag)
    {
        if (string.IsNullOrWhiteSpace(tag)) return string.Empty;
        var trimmed = tag.Trim();
        if (trimmed.Length == 1) return trimmed.ToUpperInvariant();
        return char.ToUpperInvariant(trimmed[0]) + trimmed[1..].ToLowerInvariant();
    }

    public static List<string> CleanAndNormalize(IEnumerable<string>? tags)
    {
        if (tags == null) return [];
        return tags
            .Select(t => t?.Trim())
            .Where(t => !string.IsNullOrEmpty(t) && LetterOnlyRegex.IsMatch(t) && t.Length <= MaxTagLength)
            .Select(t => ToTitleCase(t!))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
