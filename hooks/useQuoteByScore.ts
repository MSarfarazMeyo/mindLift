import { useState, useEffect } from 'react';

// Quote interface
interface Quote {
    text: string;
    author: string;
    level: string;
}

// Custom hook for fetching quotes
export const useQuoteByScore = (score: number) => {
    const [quote, setQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Determine quote category based on score
    const getQuoteCategory = (score: number) => {
        if (score <= 1.5) return { category: 'motivational', level: 'SAD' };
        else if (score <= 2.5) return { category: 'inspirational', level: 'LOW' };
        else if (score <= 3.5) return { category: 'positive', level: 'NEUTRAL' };
        else if (score <= 4.5) return { category: 'success', level: 'GOOD' };
        else return { category: 'happiness', level: 'EXCELLENT' };
    };

    // Fallback quotes in case API fails
    const getFallbackQuote = (score: number): Quote => {
        if (score <= 1.5) {
            return {
                text: "Even the darkest night will end and the sun will rise.",
                author: "Victor Hugo",
                level: "SAD"
            };
        } else if (score <= 2.5) {
            return {
                text: "It's okay to not be okay. Just don't stay there.",
                author: "Unknown",
                level: "LOW"
            };
        } else if (score <= 3.5) {
            return {
                text: "Not every day is good, but there's something good in every day.",
                author: "Alice Morse Earle",
                level: "NEUTRAL"
            };
        } else if (score <= 4.5) {
            return {
                text: "Keep going. Everything you need will come to you at the perfect time.",
                author: "Unknown",
                level: "GOOD"
            };
        } else {
            return {
                text: "This is the day I have dreamed of – everything feels just right.",
                author: "Unknown",
                level: "EXCELLENT"
            };
        }
    };

    // Fetch quote from API
    const fetchQuote = async (category: string, level: string) => {
        try {
            setLoading(true);
            setError(null);

            // Option 1: Quotable API (free, no key required)
            const response = await fetch(`https://api.quotable.io/random?tags=${category}&limit=1`);

            if (!response.ok) {
                throw new Error('Failed to fetch quote');
            }

            const data = await response.json();

            setQuote({
                text: data.content,
                author: data.author,
                level: level
            });

        } catch (err) {
            console.error('Error fetching quote:', err);
            setError('Failed to fetch quote');
            // Use fallback quote
            setQuote(getFallbackQuote(score));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const { category, level } = getQuoteCategory(score);
        fetchQuote(category, level);
    }, [score]);

    return {
        quote, loading, error, refetch: () => {
            const { category, level } = getQuoteCategory(score);
            fetchQuote(category, level);
        }
    };
};

// Alternative API options (choose one)
export const useAlternativeQuoteAPI = (score: number) => {
    const [quote, setQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                // Option 2: ZenQuotes API (free, no key required)
                const response = await fetch('https://zenquotes.io/api/random');
                const data = await response.json();

                const level = score <= 1.5 ? 'SAD' :
                    score <= 2.5 ? 'LOW' :
                        score <= 3.5 ? 'NEUTRAL' :
                            score <= 4.5 ? 'GOOD' : 'EXCELLENT';

                setQuote({
                    text: data[0].q,
                    author: data[0].a,
                    level: level
                });

            } catch (error) {
                console.error('Error fetching quote:', error);
                // Fallback to static quote
                setQuote({
                    text: "Today is a new opportunity to grow and shine.",
                    author: "Unknown",
                    level: "NEUTRAL"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchQuote();
    }, [score]);

    return { quote, loading };
};

