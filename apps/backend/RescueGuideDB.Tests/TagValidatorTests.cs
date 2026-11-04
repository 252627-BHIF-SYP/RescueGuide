using RescueGuideDB.Core;
using Xunit;

namespace RescueGuideDB.Tests;

public class TagValidatorTests
{
    [Fact]
    public void ValidateTags_WithNullOrEmptyList_ShouldBeValid()
    {
        var (isValidNull, errorNull) = TagValidator.ValidateTags(null);
        Assert.True(isValidNull);
        Assert.Null(errorNull);

        var (isValidEmpty, errorEmpty) = TagValidator.ValidateTags(new List<string>());
        Assert.True(isValidEmpty);
        Assert.Null(errorEmpty);
    }

    [Theory]
    [InlineData("Atmung")]
    [InlineData("Reanimation")]
    [InlineData("Trauma")]
    [InlineData("Blutung")]
    [InlineData("Kreislauf")]
    [InlineData("Unterkühlung")]
    [InlineData("Großschadenslage")]
    [InlineData("Ärzte")]
    [InlineData("Überdruck")]
    public void ValidateTags_WithLettersOnlyAndUmlauts_ShouldBeValid(string tag)
    {
        var (isValid, error) = TagValidator.ValidateTags(new[] { tag });
        Assert.True(isValid);
        Assert.Null(error);
    }

    [Fact]
    public void ValidateTags_WithArbitraryManyTags_ShouldBeValid()
    {
        var tags = Enumerable.Range(1, 100).Select(i => "Tag" + (char)('a' + (i % 26))).ToList();
        var (isValid, error) = TagValidator.ValidateTags(tags);
        Assert.True(isValid);
        Assert.Null(error);
    }

    [Theory]
    [InlineData("Tag123")]
    [InlineData("Tag-Name")]
    [InlineData("Tag_Name")]
    [InlineData("Zwei Wörter")]
    [InlineData("Notfall!")]
    [InlineData("#Tag")]
    public void ValidateTags_WithNonLetters_ShouldBeInvalid(string tag)
    {
        var (isValid, error) = TagValidator.ValidateTags(new[] { tag });
        Assert.False(isValid);
        Assert.NotNull(error);
        Assert.Contains("nur aus Buchstaben", error);
    }

    [Fact]
    public void ValidateTags_ExceedingMaxLength_ShouldBeInvalid()
    {
        var longTag = new string('a', TagValidator.MaxTagLength + 1);
        var (isValid, error) = TagValidator.ValidateTags(new[] { longTag });
        Assert.False(isValid);
        Assert.NotNull(error);
        Assert.Contains("überschreitet die Maximallänge", error);
    }

    [Fact]
    public void ValidateTags_WithEmptyOrWhitespaceString_ShouldBeInvalid()
    {
        var (isValid, error) = TagValidator.ValidateTags(new[] { "   " });
        Assert.False(isValid);
        Assert.NotNull(error);
        Assert.Contains("darf nicht leer sein", error);
    }

    [Fact]
    public void CleanAndNormalize_ShouldTrimDeduplicateAndFilter()
    {
        var input = new[] { " Atmung ", "atmung", "BLUTUNG", "Reanimation123", "   " };
        var cleaned = TagValidator.CleanAndNormalize(input);

        Assert.Equal(2, cleaned.Count);
        Assert.Contains("Atmung", cleaned);
        Assert.Contains("Blutung", cleaned);
    }

    [Theory]
    [InlineData("reanimation", "Reanimation")]
    [InlineData("ATMUNG", "Atmung")]
    [InlineData("blutung", "Blutung")]
    [InlineData("überdruck", "Überdruck")]
    [InlineData("ä", "Ä")]
    public void ToTitleCase_ShouldFormatCorrectly(string input, string expected)
    {
        var result = TagValidator.ToTitleCase(input);
        Assert.Equal(expected, result);
    }
}

